package handlers

import (
	"fmt"

	"github.com/lestrrat-go/jwx/jwt"
	"isnan.eu/meal-planner/api/internal/helper"
)

type tokenInfo struct {
	userId   string
	userName string
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

	return &info
}
