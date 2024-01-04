package handlers

import (
	"fmt"

	"github.com/lestrrat-go/jwx/jwt"
	"isnan.eu/meal-planner/api/internal/core/domain"
)

type tokenInfo struct {
	TenantId string
	Username string
	Role     domain.ROLE
}

func parseAuthHeader(raw string) *tokenInfo {

	var info tokenInfo

	token, _ := jwt.Parse([]byte(raw))

	username, exists := token.Get("cognito:username")
	if exists {
		info.Username = fmt.Sprintf("%v", username)
	}

	tenantId, exists := token.Get("custom:TenantId")
	if exists {
		info.TenantId = fmt.Sprintf("%v", tenantId)
	}

	role, exists := token.Get("custom:Role")
	if exists {
		info.Role = domain.ROLE(fmt.Sprintf("%v", role))
	}

	return &info
}
