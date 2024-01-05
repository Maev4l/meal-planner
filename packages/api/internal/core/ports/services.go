package ports

import "isnan.eu/meal-planner/api/internal/core/domain"

type PlannerService interface {
	RegisterUser(name string, password string) (string, error)
	DeleteUser(tenantId string, userId string) error
	CreateGroup(memberId string, memberName string, groupName string) (*domain.Group, error)
}
