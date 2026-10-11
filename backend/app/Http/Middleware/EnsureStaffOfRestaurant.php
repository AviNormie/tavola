<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** A staff token only works for the restaurant its user belongs to. */
class EnsureStaffOfRestaurant
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless(
            $request->user()->restaurant_id === $request->route('restaurant')->id,
            403,
            __('orders.forbidden'),
        );

        return $next($request);
    }
}
