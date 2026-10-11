<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Picks the response language (validation messages etc.) from the Accept-Language header. */
class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        app()->setLocale($request->getPreferredLanguage(['en', 'it']) ?? 'en');

        return $next($request);
    }
}
