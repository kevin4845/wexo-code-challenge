<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWishlistRequest;
use App\Models\User;
use App\Services\Tmdb\TmdbClient;
use App\Services\Tmdb\TmdbException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function __construct(private readonly TmdbClient $tmdb) {}

    public function index(Request $request): JsonResponse
    {
        $entries = $this->owner($request)->wishlists()->latest()->get();
        $movies = [];

        foreach ($entries as $entry) {
            try {
                $movies[] = $this->tmdb->get('/movie/'.$entry->tmdb_movie_id);
            } catch (TmdbException) {
                continue;
            }
        }

        return response()->json([
            'ids' => $entries->pluck('tmdb_movie_id')->map(fn (mixed $id): int => (int) $id)->values(),
            'movies' => $movies,
        ]);
    }

    public function store(StoreWishlistRequest $request): JsonResponse
    {
        $user = $this->owner($request);
        $movieId = (int) $request->validated('tmdb_movie_id');
        $movie = $this->tmdb->get("/movie/{$movieId}");

        $entry = $user->wishlists()->firstOrCreate([
            'tmdb_movie_id' => $movieId,
        ]);

        return response()->json($movie, $entry->wasRecentlyCreated ? 201 : 200);
    }

    public function show(Request $request, int $tmdbMovieId): JsonResponse
    {
        return response()->json([
            'saved' => $this->owner($request)->wishlists()->where('tmdb_movie_id', $tmdbMovieId)->exists(),
        ]);
    }

    public function destroy(Request $request, int $tmdbMovieId): JsonResponse
    {
        $deleted = $this->owner($request)->wishlists()->where('tmdb_movie_id', $tmdbMovieId)->delete();

        return response()->json(null, $deleted > 0 ? 204 : 404);
    }

    private function owner(Request $request): User
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        return $user;
    }
}
