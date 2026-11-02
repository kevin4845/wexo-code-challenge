<?php

namespace App\Services\Tmdb;

use RuntimeException;

class TmdbException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly int $status = 502,
    ) {
        parent::__construct($message);
    }
}
