package domain

import (
	"time"
)

type Tenant struct {
	Id        string
	Name      string
	CreatedAt *time.Time
}

type User struct {
	Id        string
	Name      string
	CreatedAt *time.Time
	TenantId  string
	Role      ROLE
}
