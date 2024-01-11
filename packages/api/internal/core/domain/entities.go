package domain

import (
	"time"

	"isnan.eu/meal-planner/api/internal/core/domain/roles"
	"isnan.eu/meal-planner/api/internal/helper"
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
	MemberId       string
	MemberName     string
	GroupName      string
	GroupId        string
	Role           roles.GROUP_ROLE
	CreatedAt      *time.Time
	WeeklySchedule WeeklySchedule
}

const MEMBER_DEFAULT_SCHEDULE_ID = "default"

func (m *MemberDefaultSchedule) GetId() string {
	return MEMBER_DEFAULT_SCHEDULE_ID
}

func (m *MemberDefaultSchedule) IsDefault() bool {
	return true
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
	Overriden  bool
	Schedule   MemberDefaultSchedule
}

func (m *MemberSchedule) IsDefault() bool {
	return false
}

func (s *MemberSchedule) GetId() string {
	return helper.NewScheduleId(s.Year, s.WeekNumber)
}
