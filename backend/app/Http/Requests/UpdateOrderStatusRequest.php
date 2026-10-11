<?php

namespace App\Http\Requests;

use App\Enums\OrderStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderStatusRequest extends FormRequest
{
    public function rules(): array
    {
        return ['status' => ['required', Rule::enum(OrderStatus::class)]];
    }

    public function messages(): array
    {
        return [
            'status.required' => __('orders.status_invalid'),
            'status.enum' => __('orders.status_invalid'),
        ];
    }
}
