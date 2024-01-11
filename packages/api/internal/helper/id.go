package helper

import (
	"fmt"
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

func NewScheduleId(year int, week int) string {
	return fmt.Sprintf("%d-%d", year, week)
}
