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
                // Details come from the shared TMDB client, which caches them. The row stores only the id.
                $movies[] = $this->tmdb->get('/movie/'.$entry->tmdb_movie_id);
            } catch (TmdbException) {
                // One unavailable title should not hide the rest of this user's list.
                continue;
            }
        }

        return response()->json([
            // Ids stay in the response even when a detail lookup was skipped, so the film remains saved.
            'ids' => $entries->pluck('tmdb_movie_id')->map(fn (mixed $id): int => (int) $id)->values(),
            'movies' => $movies,
        ]);
    }

    public function store(StoreWishlistRequest $request): JsonResponse
    {
        $user = $this->owner($request);
        $movieId = (int) $request->validated('tmdb_movie_id');
        // Confirm the title exists before writing a row. A 404 from TMDB then saves nothing.
        $movie = $this->tmdb->get("/movie/{$movieId}");

        $entry = $user->wishlists()->firstOrCreate([
            'tmdb_movie_id' => $movieId,
        ]);

        // A repeated save is the unique constraint doing its job, not a client error.
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
        // The session user is the only owner. A user id in the body or query is never read.
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        return $user;
    }
}
