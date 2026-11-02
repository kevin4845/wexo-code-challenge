<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_visitor_can_register_and_read_the_session_user(): void
    {
        $response = $this->fromSpa()->postJson('/register', [
            'name' => 'Ada Lovelace',
            'email' => 'ada@example.com',
            'password' => 'FrameNight1',
            'password_confirmation' => 'FrameNight1',
        ]);

        $response->assertCreated()
            ->assertJsonPath('name', 'Ada Lovelace')
            ->assertJsonPath('email', 'ada@example.com')
            ->assertJsonMissingPath('password');

        $this->assertDatabaseHas('users', ['email' => 'ada@example.com']);

        $this->fromSpa()->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('email', 'ada@example.com')
            ->assertJsonMissingPath('password');
    }

    public function test_registration_rejects_a_mismatched_password(): void
    {
        $this->fromSpa()->postJson('/register', [
            'name' => 'Ada Lovelace',
            'email' => 'ada@example.com',
            'password' => 'FrameNight1',
            'password_confirmation' => 'Different1',
        ])->assertStatus(422)->assertJsonValidationErrors(['password']);
    }

    public function test_a_user_can_log_in_and_log_out(): void
    {
        User::factory()->create([
            'email' => 'ada@example.com',
            'password' => 'FrameNight1',
        ]);

        $this->fromSpa()->postJson('/login', [
            'email' => 'ada@example.com',
            'password' => 'wrong-password',
        ])->assertStatus(422)->assertJsonValidationErrors(['email']);

        $this->fromSpa()->postJson('/login', [
            'email' => 'ada@example.com',
            'password' => 'FrameNight1',
        ])->assertOk()->assertJsonPath('email', 'ada@example.com');

        $this->fromSpa()->postJson('/logout')->assertOk();

        $this->fromSpa()->getJson('/api/user')->assertUnauthorized();
    }

    public function test_a_guest_cannot_read_the_session_user(): void
    {
        $this->fromSpa()->getJson('/api/user')->assertUnauthorized();
    }

    private function fromSpa(): static
    {
        $headers = [
            'Origin' => 'http://localhost:4200',
            'Referer' => 'http://localhost:4200/',
        ];

        $response = $this->withHeaders($headers)->get('/sanctum/csrf-cookie');
        $token = $response->getCookie('XSRF-TOKEN')?->getValue() ?? '';

        return $this->withHeaders([
            ...$headers,
            'X-XSRF-TOKEN' => $token,
        ]);
    }
}
