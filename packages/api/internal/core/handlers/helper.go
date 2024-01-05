package handlers

import (
	"fmt"

	"github.com/lestrrat-go/jwx/jwt"
	"isnan.eu/meal-planner/api/internal/core/domain/roles"
	"isnan.eu/meal-planner/api/internal/helper"
)

type tokenInfo struct {
	userId   string
	userName string
	role     roles.APPLICATION_ROLE
}

func parseAuthHeader(raw string) *tokenInfo {

	var info tokenInfo

	token, _ := jwt.Parse([]byte(raw))

	id, exists := token.Get("sub")
	if exists {
		info.userId = helper.Normalize(fmt.Sprintf("%v", id))
	}

	username, exists := token.Get("cognito:username")
	if exists {
		info.userName = fmt.Sprintf("%v", username)
	}

	role, exists := token.Get("custom:Role")
	if exists {
		info.role = roles.APPLICATION_ROLE(fmt.Sprintf("%v", role))
	} else {
		info.role = roles.RegularUser
	}

	return &info
}
