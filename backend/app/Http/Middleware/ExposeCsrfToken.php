<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ExposeCsrfToken
{
    /**
     * The SPA cannot read an XSRF-TOKEN cookie that belongs to the API host.
     * CORS reveals this header only to the one configured frontend origin.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($request->hasSession()) {
            $response->headers->set('X-CSRF-TOKEN', $request->session()->token());
        }

        return $response;
    }
}
