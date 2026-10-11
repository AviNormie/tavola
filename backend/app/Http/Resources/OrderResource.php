<?php

namespace App\Http\Resources;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Order */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'status' => $this->status,
            'table' => $this->table->number,
            'total_cents' => $this->total_cents,
            'created_at' => $this->created_at,
            'items' => $this->items->map(fn ($line) => [
                'quantity' => $line->quantity,
                'unit_price_cents' => $line->unit_price_cents,
                'name' => ['en' => $line->menuItem->name_en, 'it' => $line->menuItem->name_it],
            ]),
        ];
    }
}
