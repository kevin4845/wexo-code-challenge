<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GenreMoviesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function validationData(): array
    {
        return [
            ...$this->query(),
            'genreId' => $this->route('genreId'),
        ];
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'genreId' => ['required', 'integer', 'min:1'],
            'page' => ['sometimes', 'integer', 'min:1', 'max:500'],
            'sort' => ['sometimes', 'string', 'in:popular,latest,top-rated'],
        ];
    }
}
