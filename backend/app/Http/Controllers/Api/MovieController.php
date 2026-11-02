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
     * @return array<string, int>
     */
    private function pageQuery(PageRequest $request): array
    {
        $page = $request->validated('page');

        return $page === null ? [] : ['page' => (int) $page];
    }
}
