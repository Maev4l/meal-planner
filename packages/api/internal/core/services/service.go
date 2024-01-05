package services

import (
	"slices"

	"isnan.eu/meal-planner/api/internal/core/ports"
)

var RESERVED_USERNAMES = []string{"admin"}

func validateUsername(name string) bool {
	index := slices.IndexFunc(RESERVED_USERNAMES, func(s string) bool { return s == name })
	return (index == -1)
}

type service struct {
	repo ports.PlannerRepository
	idp  ports.PlannerIdP
}

func New(repo ports.PlannerRepository, idp ports.PlannerIdP) *service {
	return &service{
		repo: repo,
		idp:  idp,
	}
}
