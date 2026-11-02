<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PageRequest;
use App\Http\Requests\SearchMoviesRequest;
use App\Services\Tmdb\TmdbClient;
use Illuminate\Http\JsonResponse;

/**
 * Returns TMDB's own JSON. The Angular app already parses that shape, and image files are not proxied.
 */
class MovieController extends Controller
{
    public function __construct(private readonly TmdbClient $tmdb) {}

    public function popular(PageRequest $request): JsonResponse
    {
        return response()->json($this->tmdb->get('/movie/popular', $this->pageQuery($request)));
    }

    public function trending(PageRequest $request): JsonResponse
    {
        return response()->json($this->tmdb->get('/trending/movie/week', $this->pageQuery($request)));
    }

    public function nowPlaying(PageRequest $request): JsonResponse
    {
        return response()->json($this->tmdb->get('/movie/now_playing', $this->pageQuery($request)));
    }

    public function upcoming(PageRequest $request): JsonResponse
    {
        return response()->json($this->tmdb->get('/movie/upcoming', $this->pageQuery($request)));
    }

    public function search(SearchMoviesRequest $request): JsonResponse
    {
        $validated = $request->validated();

        return response()->json($this->tmdb->get('/search/movie', [
            'query' => $validated['query'],
            'page' => (int) ($validated['page'] ?? 1),
        ]));
    }

    public function show(int $movieId): JsonResponse
    {
        return response()->json($this->tmdb->get("/movie/{$movieId}"));
    }

    public function credits(int $movieId): JsonResponse
    {
        return response()->json($this->tmdb->get("/movie/{$movieId}/credits"));
    }

    public function videos(int $movieId): JsonResponse
    {
        return response()->json($this->tmdb->get("/movie/{$movieId}/videos"));
    }

    public function recommendations(PageRequest $request, int $movieId): JsonResponse
    {
        return response()->json($this->tmdb->get(
            "/movie/{$movieId}/recommendations",
            $this->pageQuery($request),
        ));
    }

    public function similar(PageRequest $request, int $movieId): JsonResponse
    {
        return response()->json($this->tmdb->get(
            "/movie/{$movieId}/similar",
            $this->pageQuery($request),
        ));
    }

    /**
     * Only Denmark is returned. The shared client still caches TMDB's full regional payload.
     */
    public function watchProviders(int $movieId): JsonResponse
    {
        return response()->json($this->denmarkProviders(
            $this->tmdb->get("/movie/{$movieId}/watch/providers"),
        ));
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{
     *     link: string|null,
     *     flatrate: list<array{provider_id: int, provider_name: string, logo_path: string|null, display_priority: int}>,
     *     rent: list<array{provider_id: int, provider_name: string, logo_path: string|null, display_priority: int}>,
     *     buy: list<array{provider_id: int, provider_name: string, logo_path: string|null, display_priority: int}>
     * }
     */
    private function denmarkProviders(array $payload): array
    {
        $results = $payload['results'] ?? null;
        $region = is_array($results) ? ($results['DK'] ?? null) : null;

        if (! is_array($region)) {
            return [
                'link' => null,
                'flatrate' => [],
                'rent' => [],
                'buy' => [],
            ];
        }

        return [
            'link' => $this->watchLink($region['link'] ?? null),
            'flatrate' => $this->providers($region['flatrate'] ?? null),
            'rent' => $this->providers($region['rent'] ?? null),
            'buy' => $this->providers($region['buy'] ?? null),
        ];
    }

    /**
     * Logos open the TMDB watch page, so a link to any other host is dropped.
     */
    private function watchLink(mixed $link): ?string
    {
        if (! is_string($link) || ! str_starts_with($link, 'https://www.themoviedb.org/')) {
            return null;
        }

        return $link;
    }

    /**
     * @return list<array{provider_id: int, provider_name: string, logo_path: string|null, display_priority: int}>
     */
    private function providers(mixed $providers): array
    {
        if (! is_array($providers)) {
            return [];
        }

        $clean = [];

        foreach ($providers as $provider) {
            if (! is_array($provider)) {
                continue;
            }

            $id = $provider['provider_id'] ?? null;
            $name = $provider['provider_name'] ?? null;

            if (! is_int($id) || $id < 1 || ! is_string($name) || trim($name) === '') {
                continue;
            }

            $logo = $provider['logo_path'] ?? null;
            $priority = $provider['display_priority'] ?? null;

            $clean[] = [
                'provider_id' => $id,
                'provider_name' => trim($name),
                'logo_path' => is_string($logo) && str_starts_with($logo, '/') ? $logo : null,
                'display_priority' => is_int($priority) ? $priority : 1000,
            ];
        }

        usort(
            $clean,
            static fn (array $left, array $right): int => $left['display_priority'] <=> $right['display_priority'],
        );

        $unique = [];
        $seen = [];

        foreach ($clean as $provider) {
            if (isset($seen[$provider['provider_id']])) {
                continue;
            }

            $seen[$provider['provider_id']] = true;
            $unique[] = $provider;
        }

        return $unique;
    }

    /**
     * @return array<string, int>
     */
    private function pageQuery(PageRequest $request): array
    {
        $page = $request->validated('page');

        return $page === null ? [] : ['page' => (int) $page];
    }
}
