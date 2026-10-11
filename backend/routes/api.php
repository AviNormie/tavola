<?php

use App\Http\Controllers\OrderController;
use App\Http\Controllers\RestaurantController;
use App\Http\Controllers\StaffAuthController;
use Illuminate\Support\Facades\Route;

// Every route lives under a restaurant slug; scopeBindings() makes {order} resolve
// through $restaurant->orders(), so an order id from another tenant is a 404.
Route::prefix('restaurants/{restaurant:slug}')->scopeBindings()->group(function () {
    Route::get('/', [RestaurantController::class, 'show']);
    Route::get('menu', [RestaurantController::class, 'menu']);
    Route::post('orders', [OrderController::class, 'store'])->middleware('throttle:30,1');
    Route::post('staff/login', [StaffAuthController::class, 'login'])->middleware('throttle:10,1');

    Route::middleware(['auth:sanctum', 'staff'])->group(function () {
        Route::post('staff/logout', [StaffAuthController::class, 'logout']);
        Route::get('orders', [OrderController::class, 'index']);
        Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus']);
    });
});
