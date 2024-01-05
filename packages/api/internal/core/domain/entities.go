package domain

import (
	"time"

	"isnan.eu/meal-planner/api/internal/core/domain/roles"
)

type Group struct {
	Id        string
	Name      string
	CreatedAt *time.Time
}

type Member struct {
	Id        string
	Name      string
	CreatedAt *time.Time
	Role      roles.GROUP_ROLE
}
