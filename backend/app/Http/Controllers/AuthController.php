<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Session cookie authentication for the first-party SPA.
     * These actions never issue personal access tokens.
     */
    public function user(Request $request): JsonResponse
    {
        return response()->json($this->payload($this->authenticated($request)));
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::query()->create([
            'name' => $request->string('name')->toString(),
            // Stored lowercase so a later login matches regardless of the casing submitted here.
            'email' => $request->string('email')->lower()->toString(),
            // The User model hashes this cast. Hashing it here would store a hash of a hash.
            'password' => $request->string('password')->toString(),
        ]);

        Auth::login($user);
        // Replace the anonymous session id so a pre-login cookie cannot be reused.
        $request->session()->regenerate();

        return response()->json($this->payload($user), 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = [
            'email' => $request->string('email')->lower()->toString(),
            'password' => $request->string('password')->toString(),
        ];

        if (! Auth::attempt($credentials)) {
            // The same message for an unknown email and a wrong password avoids confirming which accounts exist.
            throw ValidationException::withMessages([
                'email' => ['These credentials do not match our records.'],
            ]);
        }

        $request->session()->regenerate();

        return response()->json($this->payload($this->authenticated($request)));
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        // The previous CSRF token belonged to the session that was just destroyed.
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out.']);
    }

    private function authenticated(Request $request): User
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        return $user;
    }

    /**
     * @return array{id: int, name: string, email: string}
     */
    private function payload(User $user): array
    {
        // An explicit allow-list, so a later attribute on User cannot leak through this response.
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ];
    }
}
