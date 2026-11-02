<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WishlistTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'tmdb.base_url' => 'https://api.themoviedb.org/3',
            'tmdb.access_token' => 'test-token',
            'tmdb.api_key' => '',
            'tmdb.cache_ttl' => 600,
        ]);
    }

    public function test_a_user_can_save_and_remove_a_movie(): void
    {
        Http::fake([
            'https://api.themoviedb.org/*' => Http::response($this->movie()),
        ]);

        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/wishlist', ['tmdb_movie_id' => 550])
            ->assertCreated()
            ->assertJsonPath('title', 'Fight Club')
            ->assertJsonMissingPath('user_id');

        $this->assertDatabaseHas('wishlists', [
            'user_id' => $user->id,
            'tmdb_movie_id' => 550,
        ]);

        $this->actingAs($user)
            ->getJson('/api/wishlist')
            ->assertOk()
            ->assertJsonPath('ids.0', 550)
            ->assertJsonPath('movies.0.title', 'Fight Club')
            ->assertJsonPath('movies.0.poster_path', '/poster.jpg')
            ->assertJsonPath('movies.0.release_date', '1999-10-15');

        $this->actingAs($user)
            ->getJson('/api/wishlist/550')
            ->assertOk()
            ->assertJsonPath('saved', true);

        $this->actingAs($user)->deleteJson('/api/wishlist/550')->assertNoContent();

        $this->assertDatabaseMissing('wishlists', [
            'user_id' => $user->id,
            'tmdb_movie_id' => 550,
        ]);

        Http::assertSentCount(1);
    }

    public function test_adding_the_same_movie_twice_keeps_one_row(): void
    {
        Http::fake([
            'https://api.themoviedb.org/*' => Http::response($this->movie()),
        ]);

        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/wishlist', ['tmdb_movie_id' => 550])->assertCreated();
        $this->actingAs($user)->postJson('/api/wishlist', ['tmdb_movie_id' => 550])->assertOk();

        $this->assertSame(1, $user->wishlists()->count());
    }

    public function test_wishlists_are_scoped_to_the_authenticated_user(): void
    {
        Http::fake([
            'https://api.themoviedb.org/*' => Http::response($this->movie()),
        ]);

        $owner = User::factory()->create();
        $other = User::factory()->create();

        $this->actingAs($owner)->postJson('/api/wishlist', [
            'tmdb_movie_id' => 550,
            'user_id' => $other->id,
        ])->assertCreated();

        $this->assertDatabaseHas('wishlists', [
            'user_id' => $owner->id,
            'tmdb_movie_id' => 550,
        ]);
        $this->assertDatabaseMissing('wishlists', [
            'user_id' => $other->id,
            'tmdb_movie_id' => 550,
        ]);

        $this->actingAs($other)->getJson('/api/wishlist')->assertOk()->assertJsonPath('ids', []);
        $this->actingAs($other)->getJson('/api/wishlist/550')->assertOk()->assertJsonPath('saved', false);
        $this->actingAs($other)->deleteJson('/api/wishlist/550')->assertNotFound();

        $this->assertDatabaseHas('wishlists', [
            'user_id' => $owner->id,
            'tmdb_movie_id' => 550,
        ]);
    }

    public function test_guests_cannot_use_the_wishlist(): void
    {
        Http::fake();

        $this->getJson('/api/wishlist')->assertUnauthorized();
        $this->postJson('/api/wishlist', ['tmdb_movie_id' => 550])->assertUnauthorized();
        $this->getJson('/api/wishlist/550')->assertUnauthorized();
        $this->deleteJson('/api/wishlist/550')->assertUnauthorized();

        Http::assertNothingSent();
    }

    public function test_a_missing_catalogue_title_is_not_saved(): void
    {
        Http::fake([
            'https://api.themoviedb.org/*' => Http::response(['status_message' => 'missing'], 404),
        ]);

        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/wishlist', ['tmdb_movie_id' => 550])
            ->assertNotFound();

        $this->assertDatabaseCount('wishlists', 0);
    }

    public function test_deleting_a_user_removes_the_wishlist(): void
    {
        $user = User::factory()->create();
        $user->wishlists()->create(['tmdb_movie_id' => 550]);

        $user->delete();

        $this->assertDatabaseCount('wishlists', 0);
    }

    /**
     * @return array<string, mixed>
     */
    private function movie(): array
    {
        return [
            'id' => 550,
            'title' => 'Fight Club',
            'overview' => 'An insomniac meets a soap maker.',
            'poster_path' => '/poster.jpg',
            'backdrop_path' => '/backdrop.jpg',
            'release_date' => '1999-10-15',
            'vote_average' => 8.4,
            'vote_count' => 12000,
            'genre_ids' => [18],
        ];
    }
}
