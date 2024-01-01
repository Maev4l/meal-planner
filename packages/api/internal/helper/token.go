package helper

import (
	"fmt"
	"strconv"

	"github.com/lestrrat-go/jwx/jwt"
)

type TokenInfo struct {
	TenantId    string
	Username    string
	TenantAdmin bool
}

func ParseAuthHeader(raw string) *TokenInfo {

	var info TokenInfo

	token, _ := jwt.Parse([]byte(raw))

	username, exists := token.Get("cognito:username")
	if exists {
		info.Username = fmt.Sprintf("%v", username)
	}

	tenantId, exists := token.Get("custom:TenantId")
	if exists {
		info.TenantId = fmt.Sprintf("%v", tenantId)
	}

	tenantAdmin, exists := token.Get("custom:TenantAdmin")
	if exists {
		val, err := strconv.ParseBool(fmt.Sprintf("%v", tenantAdmin))
		if err != nil {
			val = false
		}
		info.TenantAdmin = val
	}
	return &info
}
