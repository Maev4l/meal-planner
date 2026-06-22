// CloudFront Function (viewer-request) for SPA deep-link routing.
//
// The S3 origin uses OAC (GetObject-only), so a missing object returns 403
// AccessDenied — not 404 — which means a custom_error_response on 404 never
// caught client-side routes like /invite/<code>. Instead, rewrite the ORIGIN uri
// of any extensionless path to /index.html so the app shell is always served. The
// rewrite is origin-side only: the viewer's URL is unchanged, so React Router
// still sees the real path and renders the right page.
//
// Associated only with the default (S3) cache behavior — /api/* and /assets/*
// have their own behaviors and never run this function, so API JSON error
// responses (401/403/404) pass through untouched.
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  var lastSegment = uri.substring(uri.lastIndexOf('/') + 1);
  // No file extension => client-side route; serve the SPA shell from S3.
  if (lastSegment.indexOf('.') === -1) {
    request.uri = '/index.html';
  }
  return request;
}
