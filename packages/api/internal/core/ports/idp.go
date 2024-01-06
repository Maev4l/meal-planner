package ports

import "isnan.eu/meal-planner/api/internal/core/domain"

type PlannerIdP interface {
	RegisterUser(name string, password string, role string) (*domain.User, error)
	GetUser(name string) (*domain.User, error)
}
