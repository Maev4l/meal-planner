package handlers

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lestrrat-go/jwx/jwt"
	"github.com/rs/zerolog/log"
	"isnan.eu/meal-planner/functions/api/internal/core/domain"
)

type tokenInfo struct {
	userId   string
	userName string // cognito:username (login id / email)
	name     string // display name (Cognito 'name' attribute); falls back to userName
	approved bool
}

func parseAuthHeader(raw string) *tokenInfo {

	var info tokenInfo

	token, _ := jwt.Parse([]byte(raw))

	// User ID from custom:Id claim (no normalization needed)
	id, exists := token.Get("custom:Id")
	if exists {
		info.userId = fmt.Sprintf("%v", id)
	}

	username, exists := token.Get("cognito:username")
	if exists {
		info.userName = fmt.Sprintf("%v", username)
	}

	// Display name from the 'name' claim (Cognito name attribute). Used when
	// recording a member's name (create group / redeem invite); falls back to
	// the login username if absent — mirrors the web client's
	// `payload.name || payload['cognito:username']`.
	name, exists := token.Get("name")
	if exists {
		info.name = fmt.Sprintf("%v", name)
	}
	if info.name == "" {
		info.name = info.userName
	}

	// Check if user is approved
	approved, exists := token.Get("custom:Approved")
	if exists {
		info.approved = fmt.Sprintf("%v", approved) == "true"
	}

	return &info
}

// abortWithServiceError maps service sentinel errors to HTTP status codes.
func abortWithServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, domain.ErrForbidden):
		c.JSON(http.StatusForbidden, gin.H{"message": "Forbidden."})
	case errors.Is(err, domain.ErrNotFound), errors.Is(err, domain.ErrExpired):
		c.JSON(http.StatusNotFound, gin.H{"message": "Not found."})
	case errors.Is(err, domain.ErrConflict), errors.Is(err, domain.ErrSoleAdmin):
		c.JSON(http.StatusConflict, gin.H{"message": err.Error()})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Internal error."})
	}
}

// RequireApproved is a middleware that rejects requests from unapproved users
func RequireApproved() gin.HandlerFunc {
	return func(c *gin.Context) {
		info := parseAuthHeader(c.Request.Header.Get("Authorization"))

		if !info.approved {
			log.Warn().Msgf("Unapproved user '%s' attempted to access API.", info.userName)
			c.JSON(http.StatusForbidden, gin.H{
				"message": "User not approved.",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
