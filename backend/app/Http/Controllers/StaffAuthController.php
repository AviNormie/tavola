<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/** Demo-grade staff login: email + password in, bearer token out. */
class StaffAuthController extends Controller
{
    public function login(Request $request, Restaurant $restaurant)
    {
        $credentials = $request->validate(['email' => ['required', 'email'], 'password' => ['required']]);

        $user = User::where('email', $credentials['email'])->where('restaurant_id', $restaurant->id)->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => __('orders.login_failed')]);
        }

        return ['token' => $user->createToken('dashboard')->plainTextToken, 'name' => $user->name];
    }

    public function logout(Request $request, Restaurant $restaurant)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }
}
