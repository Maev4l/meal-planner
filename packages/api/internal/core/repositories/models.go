package repositories

import (
	"fmt"
	"time"
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
	PK        string     `dynamodbav:"PK"` // group#1234
	SK        string     `dynamodbav:"SK"` // member#1234
	Id        string     `dynamodbav:"MemberId"`
	Name      string     `dynamodbav:"MemberName"`
	GroupId   string     `dynamodbav:"GroupId"`
	GroupName string     `dynamodbav:"GroupName"`
	Role      string     `dynamodbav:"Role"`
	CreatedAt *time.Time `dynamodbav:"CreatedAt"`
}

func createMemberSK(memberId string) string {
	return fmt.Sprintf("member#%s", memberId)
}

func createMemberPK(groupId string) string {
	return fmt.Sprintf("group#%s", groupId)
}

type Schedule struct {
	PK         string     `dynamodbav:"PK"`     // user#1234
	SK         string     `dynamodbav:"SK"`     // schedule#<schedule-id>, default or YYYY-CWXX
	GSI1PK     string     `dynamodbav:"GSI1PK"` // group#1234
	GSI1SK     string     `dynamodbav:"GSI1SK"` // schedule#<schedule-id>, default or YYYY-CWXX
	MemberId   string     `dynamodbav:"MemberId"`
	MemberName string     `dynamodbav:"MemberName"`
	GroupId    string     `dynamodbav:"GroupId"`
	GroupName  string     `dynamodbav:"GroupName"`
	Monday     int        `dynamodbav:"Monday"`
	Tuesday    int        `dynamodbav:"Tuesday"`
	Wednesday  int        `dynamodbav:"Wednesday"`
	Thursday   int        `dynamodbav:"Thursday"`
	Friday     int        `dynamodbav:"Friday"`
	Saturday   int        `dynamodbav:"Saturday"`
	Sunday     int        `dynamodbav:"Sunday"`
	CreatedAt  *time.Time `dynamodbav:"CreatedAt"`
}

type MemberSchedule struct {
	Schedule
	ExpiresAt int `dynamodbav:"ExpiresAt"`
}

func createSchedulePK(memberId string) string {
	return fmt.Sprintf("member#%s", memberId)
}

func createScheduleSK(scheduleId string) string {
	return fmt.Sprintf("schedule#%s", scheduleId)
}

func createScheduleSecondary1PK(groupId string) string {
	return fmt.Sprintf("group#%s", groupId)
}

func createScheduleSecondary1SK(scheduleId string) string {
	return fmt.Sprintf("schedule#%s", scheduleId)
}