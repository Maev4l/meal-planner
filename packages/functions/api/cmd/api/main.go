package main

import (
	"os"

	"github.com/gin-gonic/gin"
	"isnan.eu/meal-planner/functions/api/internal/core/handlers"
	"isnan.eu/meal-planner/functions/api/internal/core/repositories"
	"isnan.eu/meal-planner/functions/api/internal/core/services"
)

func main() {
	gin.SetMode(gin.ReleaseMode)

	router := gin.New()
	router.Use(handlers.HttpLogger())
	router.Use(gin.Recovery())
	router.Use(handlers.RequireApproved())

	r := repositories.NewDynamoDB()
	c := repositories.NewCognito()
	s := services.New(r, c)
	h := handlers.NewHTTPHandler(s)

	// Routes — preserved bit-for-bit from the previous main.go.
	router.POST("/api/groups", h.CreateGroup)
	router.POST("/api/groups/:groupId/members", h.CreateMember)
	router.POST("/api/groups/:groupId/schedules", h.CreateSchedule)
	router.POST("/api/groups/:groupId/comments", h.CreateComments)
	router.POST("/api/groups/:groupId/notices", h.CreateNotice)
	router.DELETE("/api/groups/:groupId/notices/:period", h.DeleteNotice)
	router.GET("/api/schedules/:period", h.GetSchedules)

	// PORT is injected by the LWA layer in AWS; defaults to 8080 for local runs.
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	_ = router.Run(":" + port)
}
