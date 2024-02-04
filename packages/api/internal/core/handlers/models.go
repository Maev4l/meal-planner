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
	Guest bool   `json:"guest"`
}

type CreateMemberReponse struct {
	Id        string `json:"id"`
	Name      string `json:"name"`
	CreatedAt string `json:"createdAt"`
}

type CreateDailyCommentsRequest struct {
	Lunch  string `json:"lunch"`
	Dinner string `json:"dinner"`
}

type CreateCommentsRequest struct {
	WeekNumber int                        `json:"weekNumber,omitempty"`
	Year       int                        `json:"year,omitempty"`
	Monday     CreateDailyCommentsRequest `json:"monday"`
	Tuesday    CreateDailyCommentsRequest `json:"tuesday"`
	Wednesday  CreateDailyCommentsRequest `json:"wednesday"`
	Thursday   CreateDailyCommentsRequest `json:"thursday"`
	Friday     CreateDailyCommentsRequest `json:"friday"`
	Saturday   CreateDailyCommentsRequest `json:"saturday"`
	Sunday     CreateDailyCommentsRequest `json:"sunday"`
}

type CreateMemberScheduleRequest struct {
	WeekNumber int `json:"weekNumber,omitempty"`
	Year       int `json:"year,omitempty"`
	Monday     int `json:"monday"`
	Tuesday    int `json:"tuesday"`
	Wednesday  int `json:"wednesday"`
	Thursday   int `json:"thursday"`
	Friday     int `json:"friday"`
	Saturday   int `json:"saturday"`
	Sunday     int `json:"sunday"`
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

type ScheduleResponse struct {
	Overriden  bool `json:"overriden"`
	Year       int  `json:"year"`
	WeekNumber int  `json:"weekNumber,omitempty"`
	Monday     int  `json:"monday"`
	Tuesday    int  `json:"tuesday"`
	Wednesday  int  `json:"wednesday"`
	Thursday   int  `json:"thursday"`
	Friday     int  `json:"friday"`
	Saturday   int  `json:"saturday"`
	Sunday     int  `json:"sunday"`
}

type DailyCommentsResponse struct {
	Lunch  string `json:"lunch"`
	Dinner string `json:"dinner"`
}
type CommentsResponse struct {
	Year       int                   `json:"year"`
	WeekNumber int                   `json:"weekNumber,omitempty"`
	Monday     DailyCommentsResponse `json:"monday"`
	Tuesday    DailyCommentsResponse `json:"tuesday"`
	Wednesday  DailyCommentsResponse `json:"wednesday"`
	Thursday   DailyCommentsResponse `json:"thursday"`
	Friday     DailyCommentsResponse `json:"friday"`
	Saturday   DailyCommentsResponse `json:"saturday"`
	Sunday     DailyCommentsResponse `json:"sunday"`
}

type MemberScheduleResponse struct {
	MemberId        string                  `json:"memberId"`
	MemberName      string                  `json:"memberName"`
	Admin           bool                    `json:"admin"`
	DefaultSchedule DefaultScheduleResponse `json:"default"`
	Schedule        ScheduleResponse        `json:"schedule"`
	Comments        CommentsResponse        `json:"comments"`
}

type GroupScheduleResponse struct {
	GroupId   string                             `json:"groupId"`
	GroupName string                             `json:"groupName"`
	Members   map[string]*MemberScheduleResponse `json:"members"`
}

type GetSchedulesResponse struct {
	Schedules []*GroupScheduleResponse `json:"schedules"`
}
