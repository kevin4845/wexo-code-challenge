# API

The Angular app calls Laravel. Movie data is proxied from TMDB. Catalogue routes do not require a session. The signed-in pages in Angular still require a login.

Session authentication uses cookies. Before `POST /register`, `POST /login`, or `POST /logout`, the browser requests `GET /sanctum/csrf-cookie`. The token comes back in the `X-CSRF-TOKEN` response header, because the API host's cookie is not readable from the frontend origin. These auth routes are not under `/api`.

`GET /api/user` and every wishlist route require a Sanctum session.

## Authentication

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/sanctum/csrf-cookie` | No | Issues the CSRF cookie for the SPA |
| POST | `/register` | No | Creates an account and starts a session |
| POST | `/login` | No | Starts a session |
| POST | `/logout` | Session | Ends the session |
| GET | `/api/user` | Sanctum | Returns the signed-in user |

## Movies

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/movies/popular` | No | Popular films |
| GET | `/api/movies/trending` | No | Films trending this week |
| GET | `/api/movies/now-playing` | No | Films now playing |
| GET | `/api/movies/upcoming` | No | Upcoming films |
| GET | `/api/movies/search` | No | Search. Requires a `query` parameter |
| GET | `/api/movies/{movieId}` | No | One film |
| GET | `/api/movies/{movieId}/credits` | No | Cast and crew |
| GET | `/api/movies/{movieId}/videos` | No | One embeddable YouTube trailer. `key` and `name` are null when none qualifies |
| GET | `/api/movies/{movieId}/watch/providers` | No | Streaming, rent, and buy offers for Denmark |
| GET | `/api/movies/{movieId}/recommendations` | No | Recommended films |
| GET | `/api/movies/{movieId}/similar` | No | Similar films |

`{movieId}` is a positive integer. The homepage uses trending films. The movie page uses credits, videos, Denmark watch providers, and recommendations. `now-playing`, `upcoming`, `popular`, and `similar` are available on the API. The current screens do not call them.

## Genres

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/genres` | No | Genre names |
| GET | `/api/genres/{genreId}/movies` | No | Films in one genre |

`{genreId}` is a positive integer. Optional query parameters are `page` and `sort` (`popular`, `latest`, or `top-rated`).

## Wishlist

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/wishlist` | Sanctum | The signed-in user's saved films |
| POST | `/api/wishlist` | Sanctum | Saves a film. Body field: `tmdb_movie_id` |
| GET | `/api/wishlist/{tmdbMovieId}` | Sanctum | Whether that film is saved |
| DELETE | `/api/wishlist/{tmdbMovieId}` | Sanctum | Removes that film |

`{tmdbMovieId}` is a positive integer. A user can only read and change their own list.
