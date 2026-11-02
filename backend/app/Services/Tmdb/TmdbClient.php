<?php

namespace App\Services\Tmdb;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class TmdbClient
{
    /**
     * @param  array<string, scalar|null>  $query
     * @return array<string, mixed>
     */
    public function get(string $path, array $query = []): array
    {
        $token = trim((string) config('tmdb.access_token'));
        $apiKey = trim((string) config('tmdb.api_key'));
        $baseUrl = rtrim((string) config('tmdb.base_url'), '/');

        if ($baseUrl === '' || ($token === '' && $apiKey === '')) {
            throw new TmdbException('The catalogue is not configured.', 503);
        }

        $query = array_merge([
            'language' => 'en-US',
            'include_adult' => 'false',
        ], $query);

        if ($token === '') {
            $query['api_key'] = $apiKey;
        }

        $query = array_filter(
            $query,
            static fn (mixed $value): bool => $value !== null && $value !== '',
        );

        ksort($query);

        $cacheKey = 'tmdb.'.sha1($path.'?'.http_build_query($query));
        $cached = Cache::get($cacheKey);

        if (is_array($cached)) {
            return $cached;
        }

        try {
            $request = Http::acceptJson()
                ->timeout((int) config('tmdb.timeout'))
                ->connectTimeout(5);

            if ($token !== '') {
                $request = $request->withToken($token);
            }

            $response = $request->get($baseUrl.'/'.ltrim($path, '/'), $query);
        } catch (ConnectionException) {
            throw new TmdbException('The catalogue could not be loaded.', 502);
        }

        if ($response->failed()) {
            throw new TmdbException($this->publicMessage($response), $this->publicStatus($response));
        }

        $payload = $response->json();

        if (! is_array($payload)) {
            throw new TmdbException('The catalogue returned an unexpected response.', 502);
        }

        Cache::put($cacheKey, $payload, now()->addSeconds((int) config('tmdb.cache_ttl')));

        return $payload;
    }

    /**
     * @return array<string, mixed>
     */
    public function moviesForGenre(int $genreId, int $page, string $sort): array
    {
        return $this->get('/discover/movie', [
            'with_genres' => $genreId,
            'page' => $page,
            ...$this->sortQuery($sort),
        ]);
    }

    /**
     * @return array<string, int|string>
     */
    private function sortQuery(string $sort): array
    {
        return match ($sort) {
            'latest' => ['sort_by' => 'primary_release_date.desc'],
            'top-rated' => ['sort_by' => 'vote_average.desc', 'vote_count.gte' => 200],
            default => ['sort_by' => 'popularity.desc'],
        };
    }

    private function publicStatus(Response $response): int
    {
        return match ($response->status()) {
            404 => 404,
            429 => 429,
            default => 502,
        };
    }

    private function publicMessage(Response $response): string
    {
        return match ($response->status()) {
            404 => 'That title could not be found.',
            429 => 'The catalogue is busy. Try again shortly.',
            default => 'The catalogue could not be loaded.',
        };
    }
}
