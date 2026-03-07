package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lestrrat-go/jwx/jwt"
	"github.com/rs/zerolog/log"
)

type tokenInfo struct {
	userId   string
	userName string
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

	// Check if user is approved
	approved, exists := token.Get("custom:Approved")
	if exists {
		info.approved = fmt.Sprintf("%v", approved) == "true"
	}

	return &info
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
