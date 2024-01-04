package repositories

import (
	"fmt"
	"time"
)

type Tenant struct {
	PK        string     `dynamodbav:"PK"` // tenant#1234
	SK        string     `dynamodbav:"SK"` // tenant#1234
	Id        string     `dynamodbav:"TenantId"`
	Name      string     `dynamodbav:"TenantName"`
	CreatedAt *time.Time `dynamodbav:"CreatedAt"`
}

func createTenantPK(id string) string {
	return fmt.Sprintf("tenant#%s", id)
}

func createTenantSK(id string) string {
	return fmt.Sprintf("tenant#%s", id)
}

type User struct {
	PK        string     `dynamodbav:"PK"` // tenant#1234#user#1234
	SK        string     `dynamodbav:"SK"` // user#1234
	Id        string     `dynamodbav:"UserId"`
	Name      string     `dynamodbav:"UserName"`
	TenantId  string     `dynamodbav:"TenantId"`
	Role      string     `dynamodbav:"Role"`
	CreatedAt *time.Time `dynamodbav:"CreatedAt"`
}

func createUserSK(userId string) string {
	return fmt.Sprintf("user#%s", userId)
}

func createUserPK(tenantId string) string {
	return fmt.Sprintf("tenant#%s", tenantId)
}
