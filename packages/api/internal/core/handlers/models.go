package handlers

import "encoding/json"

type CreateGroupRequest struct {
	Name string `json:"name"`
}

type CreateGroupResponse struct {
	Id        string `json:"id"`
	Name      string `json:"name"`
	CreatedAt string `json:"createdAt"`
}

type RegisterUserRequest struct {
	Name     string `json:"name"`
	Password string `json:"password"`
}

type RegisterUserResponse struct {
	Id        string `json:"id"`
	Name      string `json:"name"`
	CreatedAt string `json:"createdAt"`
}

type CreateMemberRequest struct {
	Name  string `json:"name"`
	Admin bool   `json:"admin"`
}

type CreateMemberReponse struct {
	Id        string `json:"id"`
	Name      string `json:"name"`
	CreatedAt string `json:"createdAt"`
}

type CreateCommentsRequest struct {
	Lunch  string `json:"lunch"`
	Dinner string `json:"dinner"`
}

type CreateDailyScheduleRequest struct {
	Meals    int                   `json:"meals"`
	Comments CreateCommentsRequest `json:"comments"`
}

type CreateMemberScheduleRequest struct {
	WeekNumber int                        `json:"weekNumber,omitempty"`
	Year       int                        `json:"year,omitempty"`
	Monday     CreateDailyScheduleRequest `json:"monday"`
	Tuesday    CreateDailyScheduleRequest `json:"tuesday"`
	Wednesday  CreateDailyScheduleRequest `json:"wednesday"`
	Thursday   CreateDailyScheduleRequest `json:"thursday"`
	Friday     CreateDailyScheduleRequest `json:"friday"`
	Saturday   CreateDailyScheduleRequest `json:"saturday"`
	Sunday     CreateDailyScheduleRequest `json:"sunday"`
}

type CreateDefaultScheduleRequest struct {
	Monday    int `json:"monday"`
	Tuesday   int `json:"tuesday"`
	Wednesday int `json:"wednesday"`
	Thursday  int `json:"thursday"`
	Friday    int `json:"friday"`
	Saturday  int `json:"saturday"`
	Sunday    int `json:"sunday"`
}

type CreateScheduleRequest struct {
	Default  bool            `json:"default"`
	Schedule json.RawMessage `json:"schedule"`
}

type DefaultScheduleResponse struct {
	Monday    int `json:"monday"`
	Tuesday   int `json:"tuesday"`
	Wednesday int `json:"wednesday"`
	Thursday  int `json:"thursday"`
	Friday    int `json:"friday"`
	Saturday  int `json:"saturday"`
	Sunday    int `json:"sunday"`
}

type CommentsResponse struct {
	Lunch  string `json:"lunch"`
	Dinner string `json:"dinner"`
}

type DailyScheduleResponse struct {
	Meals    int              `json:"meals"`
	Comments CommentsResponse `json:"comments"`
}

type ScheduleResponse struct {
	Overriden  bool                  `json:"overriden"`
	Year       int                   `json:"year"`
	WeekNumber int                   `json:"weekNumber,omitempty"`
	Monday     DailyScheduleResponse `json:"monday"`
	Tuesday    DailyScheduleResponse `json:"tuesday"`
	Wednesday  DailyScheduleResponse `json:"wednesday"`
	Thursday   DailyScheduleResponse `json:"thursday"`
	Friday     DailyScheduleResponse `json:"friday"`
	Saturday   DailyScheduleResponse `json:"saturday"`
	Sunday     DailyScheduleResponse `json:"sunday"`
}

type MemberScheduleResponse struct {
	MemberId        string                  `json:"memberId"`
	MemberName      string                  `json:"memberName"`
	Admin           bool                    `json:"admin"`
	DefaultSchedule DefaultScheduleResponse `json:"default"`
	Schedule        ScheduleResponse        `json:"schedule"`
}

type GroupScheduleResponse struct {
	GroupId   string                             `json:"groupId"`
	GroupName string                             `json:"groupName"`
	Members   map[string]*MemberScheduleResponse `json:"members"`
}

type GetSchedulesResponse struct {
	Schedules []*GroupScheduleResponse `json:"schedules"`
}
