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

// NewInviteCode returns a crypto-strong, ~128-bit invite code.
// We reuse google/uuid (crypto-strong) and normalize like our other ids
// (uppercase, no dashes). Invite links are shared by copy/Web Share, never
// typed, so length is not a UX concern; entropy defeats enumeration.
func NewInviteCode() string {
	return Normalize(uuid.NewString())
}

func Normalize(val string) string {
	return strings.ToUpper(strings.Replace(val, "-", "", -1))
}

func NewScheduleId(year int, week int) string {
	return fmt.Sprintf("%d-%d", year, week)
}

func NewCommentsId(year int, week int) string {
	return fmt.Sprintf("%d-%d", year, week)
}

func NewNoticeId(year int, week int) string {
	return fmt.Sprintf("%d-%d", year, week)
}
