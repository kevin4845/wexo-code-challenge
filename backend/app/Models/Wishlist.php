<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One saved TMDB id. The user relation sets user_id.
 * A request is not allowed to name a different user.
 */
#[Fillable(['user_id', 'tmdb_movie_id'])]
class Wishlist extends Model
{
    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tmdb_movie_id' => 'integer',
        ];
    }
}
