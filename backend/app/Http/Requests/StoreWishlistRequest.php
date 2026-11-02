<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWishlistRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            // No user id is accepted. The controller scopes the row to the session user.
            'tmdb_movie_id' => ['required', 'integer', 'min:1'],
        ];
    }
}
