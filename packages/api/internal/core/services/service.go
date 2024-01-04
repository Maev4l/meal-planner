package services

import (
	"slices"
	"strings"

	"github.com/google/uuid"
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

func newId() string {
	id := uuid.NewString()
	return normalize(id)
}

func normalize(val string) string {
	return strings.ToUpper(strings.Replace(val, "-", "", -1))
}
