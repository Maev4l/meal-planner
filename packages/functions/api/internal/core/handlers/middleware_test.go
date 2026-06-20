package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/lestrrat-go/jwx/jwa"
	"github.com/lestrrat-go/jwx/jwt"
)

func signedToken(t *testing.T, approved bool) string {
	t.Helper()
	tok := jwt.New()
	_ = tok.Set("custom:Id", "U1")
	_ = tok.Set("cognito:username", "user-1")
	approvedStr := "false"
	if approved {
		approvedStr = "true"
	}
	_ = tok.Set("custom:Approved", approvedStr)
	signed, err := jwt.Sign(tok, jwa.HS256, []byte("test-secret"))
	if err != nil {
		t.Fatalf("sign: %v", err)
	}
	return string(signed)
}

func runMiddleware(mw gin.HandlerFunc, authHeader string) *httptest.ResponseRecorder {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/x", mw, func(c *gin.Context) { c.Status(http.StatusOK) })
	req := httptest.NewRequest(http.MethodGet, "/x", nil)
	if authHeader != "" {
		req.Header.Set("Authorization", authHeader)
	}
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func TestRequireApproved_BlocksUnapproved(t *testing.T) {
	if w := runMiddleware(RequireApproved(), signedToken(t, false)); w.Code != http.StatusForbidden {
		t.Fatalf("want 403, got %d", w.Code)
	}
}

func TestRequireApproved_AllowsApproved(t *testing.T) {
	if w := runMiddleware(RequireApproved(), signedToken(t, true)); w.Code != http.StatusOK {
		t.Fatalf("want 200, got %d", w.Code)
	}
}

func TestRequireAuthenticated_AllowsUnapproved(t *testing.T) {
	if w := runMiddleware(RequireAuthenticated(), signedToken(t, false)); w.Code != http.StatusOK {
		t.Fatalf("want 200 (approval not required), got %d", w.Code)
	}
}
