<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GenreMoviesRequest;
use App\Services\Tmdb\TmdbClient;
use Illuminate\Http\JsonResponse;

class GenreController extends Controller
{
    public function __construct(private readonly TmdbClient $tmdb) {}

    public function index(): JsonResponse
    {
        return response()->json($this->tmdb->get('/genre/movie/list'));
    }

    public function movies(GenreMoviesRequest $request): JsonResponse
    {
        $validated = $request->validated();

        return response()->json($this->tmdb->moviesForGenre(
            (int) $validated['genreId'],
            (int) ($validated['page'] ?? 1),
            (string) ($validated['sort'] ?? 'popular'),
        ));
    }
}
