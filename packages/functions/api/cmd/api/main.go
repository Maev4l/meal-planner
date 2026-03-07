package main

import (
	"context"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	ginadapter "github.com/awslabs/aws-lambda-go-api-proxy/gin"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"isnan.eu/meal-planner/functions/api/internal/core/handlers"
	"isnan.eu/meal-planner/functions/api/internal/core/repositories"
	"isnan.eu/meal-planner/functions/api/internal/core/services"
)

var ginLambda *ginadapter.GinLambdaV2

func init() {

	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()
	config := cors.DefaultConfig()
	config.AllowCredentials = true
	config.AllowAllOrigins = true
	router.Use(cors.New(config))

	// Reject unapproved users
	router.Use(handlers.RequireApproved())

	r := repositories.NewDynamoDB()
	c := repositories.NewCognito()
	s := services.New(r, c)
	h := handlers.NewHTTPHandler(s)

	// Create a group
	router.POST("/api/groups", h.CreateGroup)

	// Enroll a user within a group
	router.POST("/api/groups/:groupId/members", h.CreateMember)

	// Create / Update a schedule for a given group
	router.POST("/api/groups/:groupId/schedules", h.CreateSchedule)

	// Create / Update comments for a given group
	router.POST("/api/groups/:groupId/comments", h.CreateComments)

	// Create / Update notices  for a given group
	router.POST("/api/groups/:groupId/notices", h.CreateNotice)

	// Delete / Reset notice
	router.DELETE("/api/groups/:groupId/notices/:period", h.DeleteNotice)

	// Get all schedules associated with a calendar week
	router.GET("/api/schedules/:period", h.GetSchedules)

	ginLambda = ginadapter.NewV2(router)
}

func handler(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	return ginLambda.ProxyWithContext(ctx, req)
}
func main() {
	lambda.Start(handler)
}
