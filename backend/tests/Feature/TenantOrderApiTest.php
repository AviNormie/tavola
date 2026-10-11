<?php

namespace Tests\Feature;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TenantOrderApiTest extends TestCase
{
    use RefreshDatabase;

    protected bool $seed = true;

    private function item(string $slug, string $nameEn): MenuItem
    {
        return Restaurant::where('slug', $slug)->firstOrFail()->menuItems()->where('name_en', $nameEn)->firstOrFail();
    }

    private function staff(string $slug): User
    {
        return User::where('restaurant_id', Restaurant::where('slug', $slug)->value('id'))->firstOrFail();
    }

    public function test_menus_are_scoped_to_the_slug(): void
    {
        $sole = $this->getJson('/api/restaurants/trattoria-sole/menu')->assertOk()->json('data.0.items.0.name.en');
        $pier = $this->getJson('/api/restaurants/north-pier-kitchen/menu')->assertOk()->json('data.0.items.0.name.en');

        $this->assertSame('Tomato bruschetta', $sole);
        $this->assertSame('Crispy calamari', $pier);
        $this->getJson('/api/restaurants/nope/menu')->assertNotFound();
    }

    public function test_total_is_computed_on_the_server_from_current_prices(): void
    {
        $carbonara = $this->item('trattoria-sole', 'Spaghetti cacio e pepe'); // 13.00

        $this->postJson('/api/restaurants/trattoria-sole/orders', [
            'table_number' => 2,
            'total_cents' => 1, // ignored
            'items' => [['menu_item_id' => $carbonara->id, 'quantity' => 3, 'unit_price_cents' => 1]],
        ])->assertCreated()->assertJsonPath('data.total_cents', 3900)->assertJsonPath('data.status', 'new');
    }

    public function test_order_rejects_unavailable_items_and_other_tenants_ids(): void
    {
        $unavailable = $this->item('trattoria-sole', 'Porcini mushroom risotto');
        $foreign = $this->item('north-pier-kitchen', 'Dry-aged burger');

        $this->postJson('/api/restaurants/trattoria-sole/orders', [
            'table_number' => 2, 'items' => [['menu_item_id' => $unavailable->id, 'quantity' => 1]],
        ], ['Accept-Language' => 'it'])->assertUnprocessable()->assertJsonValidationErrors('items.0.menu_item_id');

        $this->postJson('/api/restaurants/trattoria-sole/orders', [
            'table_number' => 2, 'items' => [['menu_item_id' => $foreign->id, 'quantity' => 1]],
        ])->assertUnprocessable()->assertJsonValidationErrors('items.0.menu_item_id');

        // Table 10 only exists at North Pier.
        $this->postJson('/api/restaurants/trattoria-sole/orders', [
            'table_number' => 10, 'items' => [['menu_item_id' => $this->item('trattoria-sole', 'Espresso')->id, 'quantity' => 1]],
        ])->assertUnprocessable()->assertJsonValidationErrors('table_number');
    }

    public function test_validation_messages_follow_accept_language(): void
    {
        $message = $this->postJson('/api/restaurants/trattoria-sole/orders', [], ['Accept-Language' => 'it'])
            ->assertUnprocessable()->json('errors.table_number.0');

        $this->assertSame('Scegli il tuo tavolo.', $message);
    }

    public function test_dashboard_endpoints_need_a_staff_token(): void
    {
        $this->getJson('/api/restaurants/trattoria-sole/orders')->assertUnauthorized();
    }

    public function test_staff_cannot_read_or_update_another_restaurants_orders(): void
    {
        Sanctum::actingAs($this->staff('trattoria-sole'));
        $pierOrder = Order::whereRelation('restaurant', 'slug', 'north-pier-kitchen')->firstOrFail();

        $this->getJson('/api/restaurants/north-pier-kitchen/orders')->assertForbidden();
        $this->patchJson("/api/restaurants/north-pier-kitchen/orders/{$pierOrder->id}/status", ['status' => 'ready'])->assertForbidden();
        // Even under their own slug, a foreign order id does not resolve.
        $this->patchJson("/api/restaurants/trattoria-sole/orders/{$pierOrder->id}/status", ['status' => 'ready'])->assertNotFound();
        $this->assertSame($pierOrder->status, $pierOrder->fresh()->status);
    }

    public function test_staff_can_list_and_advance_their_own_orders(): void
    {
        Sanctum::actingAs($this->staff('trattoria-sole'));

        $this->getJson('/api/restaurants/trattoria-sole/orders')->assertOk()->assertJsonCount(5, 'data');

        $new = Order::whereRelation('restaurant', 'slug', 'trattoria-sole')->where('status', 'new')->firstOrFail();
        $this->patchJson("/api/restaurants/trattoria-sole/orders/{$new->id}/status", ['status' => 'preparing'])
            ->assertOk()->assertJsonPath('data.status', 'preparing');
        $this->patchJson("/api/restaurants/trattoria-sole/orders/{$new->id}/status", ['status' => 'cooked'])->assertUnprocessable();
    }

    public function test_login_only_works_for_the_staffs_own_restaurant(): void
    {
        $email = $this->staff('trattoria-sole')->email;

        $this->postJson('/api/restaurants/north-pier-kitchen/staff/login', ['email' => $email, 'password' => 'demo1234'])->assertUnprocessable();
        $this->postJson('/api/restaurants/trattoria-sole/staff/login', ['email' => $email, 'password' => 'demo1234'])->assertOk()->assertJsonStructure(['token']);
    }
}
