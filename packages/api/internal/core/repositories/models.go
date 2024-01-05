package repositories

import (
	"fmt"
	"time"

	"isnan.eu/meal-planner/api/internal/core/domain"
)

type Group struct {
	PK        string     `dynamodbav:"PK"` // group#1234
	SK        string     `dynamodbav:"SK"` // group#1234
	Id        string     `dynamodbav:"GroupId"`
	Name      string     `dynamodbav:"GroupName"`
	CreatedAt *time.Time `dynamodbav:"CreatedAt"`
}

func createGroupPK(g *domain.Group) string {
	return fmt.Sprintf("group#%s", g.Id)
}

func createGroupSK(g *domain.Group) string {
	return fmt.Sprintf("group#%s", g.Id)
}

type User struct {
	PK        string     `dynamodbav:"PK"` // group#1234
	SK        string     `dynamodbav:"SK"` // user#1234
	Id        string     `dynamodbav:"UserId"`
	Name      string     `dynamodbav:"UserName"`
	GroupId   string     `dynamodbav:"GroupId"`
	GroupName string     `dynamodbav:"GroupName"`
	Role      string     `dynamodbav:"Role"`
	CreatedAt *time.Time `dynamodbav:"CreatedAt"`
}

func createMemberSK(u *domain.Member) string {
	return fmt.Sprintf("user#%s", u.Id)
}

func createMemberPK(g *domain.Group) string {
	return fmt.Sprintf("group#%s", g.Id)
}
