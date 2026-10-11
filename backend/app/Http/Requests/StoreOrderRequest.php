<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
{
    public function rules(): array
    {
        // Table and item ids are only valid if they belong to the restaurant in the URL.
        $restaurantId = $this->route('restaurant')->id;

        return [
            'table_number' => ['required', 'integer', Rule::exists('restaurant_tables', 'number')->where('restaurant_id', $restaurantId)],
            'items' => ['required', 'array', 'min:1', 'max:30'],
            'items.*.menu_item_id' => ['required', 'integer', 'distinct', Rule::exists('menu_items', 'id')->where('restaurant_id', $restaurantId)],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:20'],
        ];
    }

    public function messages(): array
    {
        return [
            'table_number.required' => __('orders.table_required'),
            'table_number.integer' => __('orders.table_required'),
            'table_number.exists' => __('orders.table_unknown'),
            'items.required' => __('orders.items_required'),
            'items.array' => __('orders.items_required'),
            'items.min' => __('orders.items_required'),
            'items.max' => __('orders.items_too_many'),
            'items.*.menu_item_id.required' => __('orders.item_unknown'),
            'items.*.menu_item_id.integer' => __('orders.item_unknown'),
            'items.*.menu_item_id.exists' => __('orders.item_unknown'),
            'items.*.menu_item_id.distinct' => __('orders.item_duplicate'),
            'items.*.quantity.required' => __('orders.quantity_range'),
            'items.*.quantity.integer' => __('orders.quantity_range'),
            'items.*.quantity.min' => __('orders.quantity_range'),
            'items.*.quantity.max' => __('orders.quantity_range'),
        ];
    }
}
