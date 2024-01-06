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
	SK        string     `dynamodbav:"SK"` // user#1234
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
