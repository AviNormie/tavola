<?php

namespace App\Http\Resources;

use App\Models\MenuCategory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin MenuCategory */
class MenuCategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => ['en' => $this->name_en, 'it' => $this->name_it],
            'items' => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'name' => ['en' => $item->name_en, 'it' => $item->name_it],
                'description' => ['en' => $item->description_en, 'it' => $item->description_it],
                'price_cents' => $item->price_cents,
                'is_available' => $item->is_available,
            ]),
        ];
    }
}
