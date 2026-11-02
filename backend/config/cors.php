<?php

$origins = array_values(array_filter(array_map(
    trim(...),
    explode(',', (string) env('CORS_ALLOWED_ORIGINS', '')),
)));

return [

    // Login and CSRF live outside /api, but the browser still calls them with credentials.
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'register', 'logout'],

    'allowed_methods' => ['GET', 'POST', 'OPTIONS'],

    'allowed_origins' => $origins,

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Accept', 'Content-Type', 'X-Requested-With', 'X-XSRF-TOKEN'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Credentials require a specific origin. An empty allow-list matches no browser.
    'supports_credentials' => true,

];
