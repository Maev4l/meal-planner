package repositories

import (
	"fmt"
	"time"

	"isnan.eu/meal-planner/api/internal/core/domain"
	"isnan.eu/meal-planner/api/internal/helper"
)

type Group struct {
	PK        string     `dynamodbav:"PK"` // group#1234
	SK        string     `dynamodbav:"SK"` // group#1234
	Id        string     `dynamodbav:"GroupId"`
	Name      string     `dynamodbav:"GroupName"`
	CreatedAt *time.Time `dynamodbav:"CreatedAt"`
}

func createGroupPK(groupId string) string {
	return fmt.Sprintf("group#%s", groupId)
}

func createGroupSK(groupId string) string {
	return fmt.Sprintf("group#%s", groupId)
}

type Member struct {
	PK        string     `dynamodbav:"PK"`     // member#1234
	SK        string     `dynamodbav:"SK"`     // group#1234
	GSI1PK    string     `dynamodbav:"GSI1PK"` // group#1234
	GSI1SK    string     `dynamodbav:"GSI1SK"` // member#1234
	Id        string     `dynamodbav:"MemberId"`
	Name      string     `dynamodbav:"MemberName"`
	GroupId   string     `dynamodbav:"GroupId"`
	GroupName string     `dynamodbav:"GroupName"`
	Role      string     `dynamodbav:"Role"`
	CreatedAt *time.Time `dynamodbav:"CreatedAt"`
}

func createMemberPK(memberId string) string {
	return fmt.Sprintf("member#%s", memberId)
}

func createMemberSK(groupId string) string {
	return fmt.Sprintf("group#%s", groupId)
}

func createMemberSecondary1PK(groupId string) string {
	return fmt.Sprintf("group#%s", groupId)
}

func createMemberSecondary1SK(memberId string) string {
	return fmt.Sprintf("member#%s", memberId)
}

type Schedule struct {
	PK         string     `dynamodbav:"PK"`     // user#1234
	SK         string     `dynamodbav:"SK"`     // schedule#<schedule-id>#group#group-1234
	GSI1PK     string     `dynamodbav:"GSI1PK"` // group#1234
	GSI1SK     string     `dynamodbav:"GSI1SK"` // schedule#<schedule-id>, default or YYYY-CWXX
	MemberId   string     `dynamodbav:"MemberId"`
	MemberName string     `dynamodbav:"MemberName"`
	GroupId    string     `dynamodbav:"GroupId"`
	GroupName  string     `dynamodbav:"GroupName"`
	MemberRole string     `dynamodbav:"Role"`
	Year       int        `dynamodbav:"Year"`
	WeekNumber int        `dynamodbav:"WeekNumber"`
	Monday     int        `dynamodbav:"Monday"`
	Tuesday    int        `dynamodbav:"Tuesday"`
	Wednesday  int        `dynamodbav:"Wednesday"`
	Thursday   int        `dynamodbav:"Thursday"`
	Friday     int        `dynamodbav:"Friday"`
	Saturday   int        `dynamodbav:"Saturday"`
	Sunday     int        `dynamodbav:"Sunday"`
	CreatedAt  *time.Time `dynamodbav:"CreatedAt"`
}

func (s *Schedule) getId() string {
	if s.Year == 0 && s.WeekNumber == 0 {
		return domain.MEMBER_DEFAULT_SCHEDULE_ID
	}
	return helper.NewScheduleId(s.Year, s.WeekNumber)
}

func (s *Schedule) isDefault() bool {
	return (s.Year == 0 && s.WeekNumber == 0)
}

type MemberSchedule struct {
	Schedule
	ExpiresAt *time.Time `dynamodbav:"ExpiresAt,unixtime"`
}

func createSchedulePK(memberId string) string {
	return fmt.Sprintf("member#%s", memberId)
}

func createScheduleSK(scheduleId string, groupId string) string {
	return fmt.Sprintf("schedule#%s#group#%s", scheduleId, groupId)
}

func createScheduleSecondary1PK(groupId string) string {
	return fmt.Sprintf("group#%s", groupId)
}

func createScheduleSecondary1SK(scheduleId string) string {
	return fmt.Sprintf("schedule#%s", scheduleId)
}
