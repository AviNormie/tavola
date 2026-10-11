<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'slug', 'default_locale', 'currency', 'description_en', 'description_it'])]
class Restaurant extends Model
{
    public function categories(): HasMany
    {
        return $this->hasMany(MenuCategory::class)->orderBy('sort_order');
    }

    public function menuItems(): HasMany
    {
        return $this->hasMany(MenuItem::class);
    }

    public function tables(): HasMany
    {
        return $this->hasMany(RestaurantTable::class)->orderBy('number');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
