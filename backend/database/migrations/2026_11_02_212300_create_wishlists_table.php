<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wishlists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // The catalogue payload stays in TMDB. This row only remembers which title the user saved.
            $table->unsignedBigInteger('tmdb_movie_id');
            $table->timestamps();

            // One saved film per user. A duplicate insert is rejected and treated as the existing row.
            $table->unique(['user_id', 'tmdb_movie_id']);
            $table->index('tmdb_movie_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wishlists');
    }
};
