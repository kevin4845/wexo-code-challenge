<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TmdbApiTest extends TestCase
{
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

    public function test_popular_movies_are_proxied_and_cached(): void
    {
        Http::fake([
            'https://api.themoviedb.org/*' => Http::response([
                'page' => 1,
                'results' => [],
                'total_pages' => 2,
                'total_results' => 20,
            ]),
        ]);

        $this->getJson('/api/movies/popular')
            ->assertOk()
            ->assertJsonPath('page', 1)
            ->assertJsonPath('total_pages', 2)
            ->assertJsonPath('total_results', 20)
            ->assertJsonMissing(['access_token' => 'test-token']);

        $this->getJson('/api/movies/popular')->assertOk();

        Http::assertSentCount(1);
    }

    public function test_failed_tmdb_responses_are_not_cached(): void
    {
        Http::fake([
            'https://api.themoviedb.org/*' => Http::sequence()
                ->push(['status_message' => 'upstream failed'], 500)
                ->push([
                    'page' => 1,
                    'results' => [],
                    'total_pages' => 1,
                    'total_results' => 0,
                ], 200),
        ]);

        $this->getJson('/api/movies/trending')->assertStatus(502);
        $this->getJson('/api/movies/trending')
            ->assertOk()
            ->assertJsonPath('total_pages', 1);

        Http::assertSentCount(2);
    }

    public function test_genre_movies_forward_page_and_sort(): void
    {
        Http::fake([
            'https://api.themoviedb.org/*' => Http::response([
                'page' => 2,
                'results' => [],
                'total_pages' => 9,
                'total_results' => 180,
            ]),
        ]);

        $this->getJson('/api/genres/28/movies?page=2&sort=top-rated')
            ->assertOk()
            ->assertJsonPath('page', 2)
            ->assertJsonPath('total_pages', 9)
            ->assertJsonPath('total_results', 180);

        Http::assertSent(function ($request): bool {
            $url = $request->url();

            return str_contains($url, 'page=2')
                && str_contains($url, 'with_genres=28')
                && str_contains($url, 'sort_by=vote_average.desc')
                && str_contains($url, 'vote_count.gte=200')
                && ! str_contains($url, 'api_key=');
        });
    }

    public function test_invalid_page_is_rejected(): void
    {
        $this->getJson('/api/genres/28/movies?page=0')->assertStatus(422);
        $this->getJson('/api/movies/not-a-number')->assertNotFound();
    }

    public function test_missing_credentials_do_not_call_tmdb(): void
    {
        config([
            'tmdb.access_token' => '',
            'tmdb.api_key' => '',
        ]);

        Http::fake();

        $this->getJson('/api/movies/popular')
            ->assertStatus(503)
            ->assertJsonPath('message', 'The catalogue is not configured.');

        Http::assertNothingSent();
    }

    public function test_search_requires_a_query(): void
    {
        $this->getJson('/api/movies/search')->assertStatus(422);
    }

    public function test_cors_allows_only_configured_origins(): void
    {
        config([
            'cors.allowed_origins' => ['http://localhost:4200', 'https://frame.example'],
        ]);

        $this->withHeader('Origin', 'http://localhost:4200')
            ->getJson('/api/movies/search')
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:4200');

        $this->flushHeaders()
            ->withHeader('Origin', 'https://evil.example')
            ->getJson('/api/movies/search')
            ->assertHeaderMissing('Access-Control-Allow-Origin');
    }
}
