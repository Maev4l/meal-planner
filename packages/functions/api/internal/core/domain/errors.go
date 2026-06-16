package domain

import "errors"

// Sentinel errors returned by services so handlers can map to HTTP status codes.
var (
	ErrForbidden = errors.New("forbidden")     // -> 403
	ErrNotFound  = errors.New("not found")     // -> 404
	ErrExpired   = errors.New("expired")       // -> 404 (invalid/expired/revoked are indistinguishable)
	ErrConflict  = errors.New("conflict")      // -> 409
	ErrSoleAdmin = errors.New("sole admin")    // -> 409 (admin cannot leave)
)
