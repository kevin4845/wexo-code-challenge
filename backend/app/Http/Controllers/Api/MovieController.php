<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PageRequest;
use App\Http\Requests\SearchMoviesRequest;
use App\Services\Tmdb\TmdbClient;
use Illuminate\Http\JsonResponse;

/**
 * Catalogue lists keep TMDB's JSON, and image files are not proxied.
 * Videos and watch providers are reduced first: one embeddable trailer, and Denmark offers only.
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

    /**
     * One embeddable YouTube video. The shared client caches TMDB's full list;
     * clips and other hosts are dropped because the page plays this inside FRAME.
     */
    public function videos(int $movieId): JsonResponse
    {
        return response()->json($this->embeddableTrailer(
            $this->tmdb->get("/movie/{$movieId}/videos"),
        ));
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
     * Official trailers win, then other trailers, then teasers. The newest video wins ties.
     *
     * @param  array<string, mixed>  $payload
     * @return array{key: string|null, name: string|null}
     */
    private function embeddableTrailer(array $payload): array
    {
        $results = $payload['results'] ?? null;
        $candidates = [];

        if (is_array($results)) {
            foreach ($results as $index => $video) {
                if (! is_array($video) || ($video['site'] ?? null) !== 'YouTube') {
                    continue;
                }

                $type = $video['type'] ?? null;
                if ($type !== 'Trailer' && $type !== 'Teaser') {
                    continue;
                }

                $key = $video['key'] ?? null;
                if (! is_string($key) || preg_match('/^[A-Za-z0-9_-]{6,64}$/', $key) !== 1) {
                    continue;
                }

                $official = ($video['official'] ?? false) === true;
                $published = $video['published_at'] ?? null;
                $timestamp = is_string($published) ? strtotime($published) : false;
                $name = $video['name'] ?? null;

                $candidates[] = [
                    'rank' => match (true) {
                        $type === 'Trailer' && $official => 0,
                        $type === 'Trailer' => 1,
                        $official => 2,
                        default => 3,
                    },
                    'published' => $timestamp === false ? 0 : $timestamp,
                    'index' => $index,
                    'key' => $key,
                    'name' => is_string($name) && trim($name) !== '' ? trim($name) : 'Trailer',
                ];
            }
        }

        usort(
            $candidates,
            static fn (array $left, array $right): int => $left['rank'] <=> $right['rank']
                ?: $right['published'] <=> $left['published']
                ?: $left['index'] <=> $right['index'],
        );

        $trailer = $candidates[0] ?? null;

        if ($trailer === null) {
            return ['key' => null, 'name' => null];
        }

        return [
            'key' => $trailer['key'],
            'name' => $trailer['name'],
        ];
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
     * Provider logos are labels, not links. This regional page is kept only when it is on TMDB.
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
