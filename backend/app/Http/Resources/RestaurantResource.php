<?php

namespace App\Http\Resources;

use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Restaurant */
class RestaurantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'name' => $this->name,
            'slug' => $this->slug,
            'default_locale' => $this->default_locale,
            'currency' => $this->currency,
            'description' => ['en' => $this->description_en, 'it' => $this->description_it],
            'tables' => $this->tables->pluck('number'),
        ];
    }
}
