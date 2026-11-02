<?php

use App\Http\Controllers\Api\GenreController;
use App\Http\Controllers\Api\MovieController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/user', [AuthController::class, 'user'])->middleware('auth:sanctum');

Route::get('/genres', [GenreController::class, 'index']);
Route::get('/genres/{genreId}/movies', [GenreController::class, 'movies'])->where('genreId', '[1-9][0-9]*');

Route::get('/movies/popular', [MovieController::class, 'popular']);
Route::get('/movies/trending', [MovieController::class, 'trending']);
Route::get('/movies/now-playing', [MovieController::class, 'nowPlaying']);
Route::get('/movies/upcoming', [MovieController::class, 'upcoming']);
Route::get('/movies/search', [MovieController::class, 'search']);
Route::get('/movies/{movieId}', [MovieController::class, 'show'])->where('movieId', '[1-9][0-9]*');
Route::get('/movies/{movieId}/credits', [MovieController::class, 'credits'])->where('movieId', '[1-9][0-9]*');
Route::get('/movies/{movieId}/videos', [MovieController::class, 'videos'])->where('movieId', '[1-9][0-9]*');
Route::get('/movies/{movieId}/recommendations', [MovieController::class, 'recommendations'])->where('movieId', '[1-9][0-9]*');
Route::get('/movies/{movieId}/similar', [MovieController::class, 'similar'])->where('movieId', '[1-9][0-9]*');
