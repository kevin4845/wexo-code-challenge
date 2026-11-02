const backend = {
  target: 'https://frame-backend.ddev.site',
  secure: false,
  changeOrigin: true,
  cookieDomainRewrite: 'localhost',
};

/** GET stays in the SPA. POST is the Laravel authentication route. */
function postOnly(request) {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return '/index.html';
  }
  return null;
}

module.exports = {
  '/api': backend,
  '/sanctum': backend,
  '/login': { ...backend, bypass: postOnly },
  '/register': { ...backend, bypass: postOnly },
  '/logout': backend,
};
