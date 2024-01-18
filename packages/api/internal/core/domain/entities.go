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

type ScheduleBase struct {
	MemberId   string
	MemberName string
	GroupName  string
	GroupId    string
	Role       roles.GROUP_ROLE
	CreatedAt  *time.Time
}

type MemberDefaultSchedule struct {
	ScheduleBase
	WeeklySchedule
}

const MEMBER_DEFAULT_SCHEDULE_ID = "default"

func (m *MemberDefaultSchedule) GetId() string {
	return MEMBER_DEFAULT_SCHEDULE_ID
}

func (m *MemberDefaultSchedule) IsDefault() bool {
	return true
}

type Comments struct {
	Lunch  string
	Dinner string
}

// Value for Meals
// 0: no lunch, no dinner
// 1: lunch, no dinner
// 2: no luch, dinner
// 3: lunch, dinner
type DailySchedule struct {
	Meals    int
	Comments Comments
}

type WeeklySchedule struct {
	Monday    DailySchedule
	Tuesday   DailySchedule
	Wednesday DailySchedule
	Thursday  DailySchedule
	Friday    DailySchedule
	Saturday  DailySchedule
	Sunday    DailySchedule
}

var SystemDefaultWeeklySchedule = WeeklySchedule{
	Monday:    DailySchedule{Meals: 3},
	Tuesday:   DailySchedule{Meals: 3},
	Wednesday: DailySchedule{Meals: 3},
	Thursday:  DailySchedule{Meals: 3},
	Friday:    DailySchedule{Meals: 3},
	Saturday:  DailySchedule{Meals: 3},
	Sunday:    DailySchedule{Meals: 3},
}

type MemberSchedule struct {
	WeekNumber int
	Year       int
	Overriden  bool
	ScheduleBase
	WeeklySchedule
}

func (m *MemberSchedule) IsDefault() bool {
	return false
}

func (s *MemberSchedule) GetId() string {
	return helper.NewScheduleId(s.Year, s.WeekNumber)
}
