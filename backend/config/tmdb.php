<?php

return [

    /*
    |--------------------------------------------------------------------------
    | TMDB
    |--------------------------------------------------------------------------
    |
    | Credentials stay in the environment. The HTTP client reads this config
    | and never returns the token or API key to the browser.
    |
    */

    'base_url' => env('TMDB_BASE_URL', 'https://api.themoviedb.org/3'),

    'access_token' => env('TMDB_ACCESS_TOKEN'),

    'api_key' => env('TMDB_API_KEY'),

    'image_base_url' => env('TMDB_IMAGE_BASE_URL', 'https://image.tmdb.org/t/p'),

    'timeout' => 10,

    'cache_ttl' => 600,

];
