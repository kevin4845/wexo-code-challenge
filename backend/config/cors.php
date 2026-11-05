<?php

$origins = array_values(array_filter(array_map(
    trim(...),
    explode(',', (string) env('CORS_ALLOWED_ORIGINS', '')),
)));

return [

    // Login and CSRF live outside /api, but the browser still calls them with credentials.
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'register', 'logout'],

    // DELETE is the wishlist removal call. A cross-origin preflight is rejected without it.
    'allowed_methods' => ['GET', 'POST', 'DELETE', 'OPTIONS'],

    'allowed_origins' => $origins,

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Accept', 'Content-Type', 'X-Requested-With', 'X-XSRF-TOKEN', 'X-CSRF-TOKEN'],

    // The SPA reads the token from this header. It cannot read the API host's cookie.
    'exposed_headers' => ['X-CSRF-TOKEN'],

    'max_age' => 0,

    // Credentials require a specific origin. An empty allow-list matches no browser.
    'supports_credentials' => true,

];
