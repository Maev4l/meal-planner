package ports

import "isnan.eu/meal-planner/functions/api/internal/core/domain"

type PlannerIdP interface {
	GetUser(name string) (*domain.User, error)
}
