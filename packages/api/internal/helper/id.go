package helper

import (
	"strings"

	"github.com/google/uuid"
)

func NewId() string {
	id := uuid.NewString()
	return Normalize(id)
}

func Normalize(val string) string {
	return strings.ToUpper(strings.Replace(val, "-", "", -1))
}
