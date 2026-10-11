<?php

namespace App\Http\Controllers;

use App\Http\Resources\MenuCategoryResource;
use App\Http\Resources\RestaurantResource;
use App\Models\Restaurant;

class RestaurantController extends Controller
{
    public function show(Restaurant $restaurant)
    {
        return new RestaurantResource($restaurant->load('tables'));
    }

    public function menu(Restaurant $restaurant)
    {
        return MenuCategoryResource::collection($restaurant->categories()->with('items')->get());
    }
}
