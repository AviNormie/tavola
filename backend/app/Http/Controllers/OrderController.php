<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Restaurant;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    // Every query below starts from $restaurant, so it can only ever see that tenant's rows.
    private const WITH = ['table', 'items.menuItem'];

    public function index(Restaurant $restaurant)
    {
        return OrderResource::collection(
            $restaurant->orders()->with(self::WITH)->latest()->limit(50)->get()
        );
    }

    public function store(StoreOrderRequest $request, Restaurant $restaurant)
    {
        $order = DB::transaction(function () use ($request, $restaurant) {
            $lines = collect($request->validated('items'));
            $menuItems = $restaurant->menuItems()->findMany($lines->pluck('menu_item_id'))->keyBy('id');

            foreach ($lines as $i => $line) {
                $item = $menuItems[$line['menu_item_id']];
                if (! $item->is_available) {
                    throw ValidationException::withMessages([
                        "items.$i.menu_item_id" => __('orders.item_unavailable', ['item' => $item->{'name_'.app()->getLocale()}]),
                    ]);
                }
            }

            // The total always comes from current menu prices, never from the client.
            $total = $lines->sum(fn ($line) => $menuItems[$line['menu_item_id']]->price_cents * $line['quantity']);

            $order = $restaurant->orders()->create([
                'restaurant_table_id' => $restaurant->tables()->where('number', $request->validated('table_number'))->value('id'),
                // ponytail: max()+1 can collide under concurrent writes; use a per-restaurant counter row with lockForUpdate on MySQL/Postgres.
                'number' => $restaurant->orders()->max('number') + 1,
                'status' => OrderStatus::New,
                'total_cents' => $total,
            ]);

            $order->items()->createMany($lines->map(fn ($line) => [
                'menu_item_id' => $line['menu_item_id'],
                'quantity' => $line['quantity'],
                'unit_price_cents' => $menuItems[$line['menu_item_id']]->price_cents,
            ]));

            return $order;
        });

        return (new OrderResource($order->load(self::WITH)))->response()->setStatusCode(201);
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Restaurant $restaurant, Order $order)
    {
        // $order was resolved through $restaurant->orders() (scoped bindings), so other tenants' orders 404.
        $order->update(['status' => $request->validated('status')]);

        return new OrderResource($order->load(self::WITH));
    }
}
