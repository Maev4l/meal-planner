package domain

import (
	"fmt"
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
	GroupId   string
	GroupName string
}

type User struct {
	Id        string
	Name      string
	CreatedAt *time.Time
	Role      roles.APPLICATION_ROLE
}

type MemberDefaultSchedule struct {
	MemberId   string
	MemberName string
	GroupName  string
	GroupId    string
	CreatedAt  *time.Time
	WeeklySchedule
}

func (m *MemberDefaultSchedule) GetId() string {
	return "default"
}

// 0: no lunch, no dinner
// 1: lunch, no dinner
// 2: no luch, dinner
// 3: lunch, dinner
type WeeklySchedule struct {
	Monday    int
	Tuesday   int
	Wednesday int
	Thursday  int
	Friday    int
	Saturday  int
	Sunday    int
}

var SystemDefaultWeeklySchedule = WeeklySchedule{
	Monday:    3,
	Tuesday:   3,
	Wednesday: 3,
	Thursday:  3,
	Friday:    3,
	Saturday:  3,
	Sunday:    3,
}

type MemberSchedule struct {
	WeekNumber int
	Year       int
	MemberDefaultSchedule
}

func (s *MemberSchedule) GetId() string {
	return fmt.Sprintf("%d-CW%d", s.Year, s.WeekNumber)
}
