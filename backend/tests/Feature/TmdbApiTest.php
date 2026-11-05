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

    public function test_watch_providers_return_denmark_only_and_are_cached(): void
    {
        Http::fake([
            'https://api.themoviedb.org/*' => Http::response([
                'id' => 550,
                'results' => [
                    'US' => [
                        'link' => 'https://www.themoviedb.org/movie/550/watch?locale=US',
                        'flatrate' => [
                            [
                                'provider_id' => 8,
                                'provider_name' => 'Netflix',
                                'logo_path' => '/us.jpg',
                                'display_priority' => 0,
                            ],
                        ],
                    ],
                    'DK' => [
                        'link' => 'https://www.themoviedb.org/movie/550/watch?locale=DK',
                        'flatrate' => [
                            [
                                'provider_id' => 119,
                                'provider_name' => 'Amazon Prime Video',
                                'logo_path' => '/prime.jpg',
                                'display_priority' => 2,
                            ],
                            [
                                'provider_id' => 2,
                                'provider_name' => 'Apple TV',
                                'logo_path' => 'https://evil.example/logo.jpg',
                                'display_priority' => 1,
                            ],
                            [
                                'provider_id' => 119,
                                'provider_name' => 'Amazon Prime Video',
                                'logo_path' => '/duplicate.jpg',
                                'display_priority' => 0,
                            ],
                        ],
                        'rent' => [
                            ['provider_id' => 3, 'provider_name' => ' ', 'logo_path' => '/x.jpg'],
                        ],
                        'buy' => [],
                        'ads' => [
                            [
                                'provider_id' => 99,
                                'provider_name' => 'Tubi',
                                'logo_path' => '/tubi.jpg',
                                'display_priority' => 0,
                            ],
                        ],
                    ],
                ],
            ]),
        ]);

        $response = $this->getJson('/api/movies/550/watch/providers')
            ->assertOk()
            ->assertJsonPath('link', 'https://www.themoviedb.org/movie/550/watch?locale=DK')
            ->assertJsonPath('flatrate.0.provider_name', 'Amazon Prime Video')
            ->assertJsonPath('flatrate.0.logo_path', '/duplicate.jpg')
            ->assertJsonPath('flatrate.1.provider_name', 'Apple TV')
            ->assertJsonPath('flatrate.1.logo_path', null)
            ->assertJsonPath('rent', [])
            ->assertJsonPath('buy', [])
            ->assertJsonMissingPath('results');

        $this->assertStringNotContainsString('Netflix', (string) $response->getContent());
        $this->assertStringNotContainsString('Tubi', (string) $response->getContent());

        $this->getJson('/api/movies/550/watch/providers')->assertOk();

        Http::assertSentCount(1);
        Http::assertSent(function ($request): bool {
            return str_contains($request->url(), '/movie/550/watch/providers')
                && ! str_contains($request->url(), 'api_key=');
        });
    }

    public function test_watch_providers_are_empty_when_denmark_is_missing(): void
    {
        Http::fake([
            'https://api.themoviedb.org/*' => Http::response([
                'id' => 550,
                'results' => [
                    'US' => [
                        'link' => 'javascript:alert(1)',
                        'flatrate' => [
                            [
                                'provider_id' => 8,
                                'provider_name' => 'Netflix',
                                'logo_path' => '/us.jpg',
                                'display_priority' => 0,
                            ],
                        ],
                    ],
                ],
            ]),
        ]);

        $this->getJson('/api/movies/550/watch/providers')
            ->assertOk()
            ->assertExactJson([
                'link' => null,
                'flatrate' => [],
                'rent' => [],
                'buy' => [],
            ]);
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

    public function test_videos_return_the_newest_official_youtube_trailer_and_are_cached(): void
    {
        Http::fake([
            'https://api.themoviedb.org/*' => Http::response([
                'results' => [
                    [
                        'site' => 'YouTube',
                        'type' => 'Trailer',
                        'official' => true,
                        'key' => 'oldertrailer',
                        'name' => 'Older trailer',
                        'published_at' => '2020-01-01T00:00:00.000Z',
                    ],
                    [
                        'site' => 'YouTube',
                        'type' => 'Teaser',
                        'official' => true,
                        'key' => 'officialtease',
                        'name' => 'Official teaser',
                        'published_at' => '2024-01-01T00:00:00.000Z',
                    ],
                    [
                        'site' => 'YouTube',
                        'type' => 'Trailer',
                        'official' => true,
                        'key' => 'newtrailerxx',
                        'name' => 'New trailer',
                        'published_at' => '2024-06-01T00:00:00.000Z',
                    ],
                    [
                        'site' => 'YouTube',
                        'type' => 'Trailer',
                        'official' => false,
                        'key' => 'fantrailerxx',
                        'name' => 'Fan trailer',
                        'published_at' => '2025-01-01T00:00:00.000Z',
                    ],
                    [
                        'site' => 'Vimeo',
                        'type' => 'Trailer',
                        'official' => true,
                        'key' => 'vimeokeyxxxx',
                        'name' => 'Vimeo',
                        'published_at' => '2025-02-01T00:00:00.000Z',
                    ],
                    [
                        'site' => 'YouTube',
                        'type' => 'Clip',
                        'official' => true,
                        'key' => 'clipkeyxxxxx',
                        'name' => 'Clip',
                        'published_at' => '2025-03-01T00:00:00.000Z',
                    ],
                    [
                        'site' => 'YouTube',
                        'type' => 'Trailer',
                        'official' => true,
                        'key' => '../not-a-key',
                        'name' => 'Bad key',
                        'published_at' => '2025-04-01T00:00:00.000Z',
                    ],
                ],
            ]),
        ]);

        $this->getJson('/api/movies/550/videos')
            ->assertOk()
            ->assertExactJson([
                'key' => 'newtrailerxx',
                'name' => 'New trailer',
            ]);

        $this->getJson('/api/movies/550/videos')->assertOk();

        Http::assertSentCount(1);
    }

    public function test_videos_prefer_an_official_teaser_when_no_trailer_can_be_played(): void
    {
        Http::fake([
            'https://api.themoviedb.org/*' => Http::response([
                'results' => [
                    [
                        'site' => 'YouTube',
                        'type' => 'Teaser',
                        'official' => false,
                        'key' => 'newerteaserx',
                        'name' => 'Newer teaser',
                        'published_at' => '2025-01-01T00:00:00.000Z',
                    ],
                    [
                        'site' => 'YouTube',
                        'type' => 'Teaser',
                        'official' => true,
                        'key' => 'officialtease',
                        'name' => 'Official teaser',
                        'published_at' => '2022-01-01T00:00:00.000Z',
                    ],
                ],
            ]),
        ]);

        $this->getJson('/api/movies/550/videos')
            ->assertOk()
            ->assertExactJson([
                'key' => 'officialtease',
                'name' => 'Official teaser',
            ]);
    }

    public function test_videos_are_empty_when_nothing_can_be_embedded(): void
    {
        Http::fake([
            'https://api.themoviedb.org/*' => Http::response([
                'results' => [
                    [
                        'site' => 'Vimeo',
                        'type' => 'Trailer',
                        'official' => true,
                        'key' => 'vimeokeyxxxx',
                        'name' => 'Vimeo',
                    ],
                ],
            ]),
        ]);

        $this->getJson('/api/movies/550/videos')
            ->assertOk()
            ->assertExactJson([
                'key' => null,
                'name' => null,
            ]);
    }
}
