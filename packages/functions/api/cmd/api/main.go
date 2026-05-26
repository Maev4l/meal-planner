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

	r := repositories.NewDynamoDB()
	c := repositories.NewCognito()
	s := services.New(r, c)
	h := handlers.NewHTTPHandler(s)

	// RequireApproved sits on the /api group, not router-global. This keeps
	// LWA's HTTP readiness probe on "/" out of the auth middleware (Gin
	// returns 404, which LWA treats as healthy; <500 means "ready"). With
	// auth global, an empty Authorization header panics parseAuthHeader and
	// LWA never sees ready → cold-start times out.
	api := router.Group("/api")
	api.Use(handlers.RequireApproved())

	api.POST("/groups", h.CreateGroup)
	api.POST("/groups/:groupId/members", h.CreateMember)
	api.POST("/groups/:groupId/schedules", h.CreateSchedule)
	api.POST("/groups/:groupId/comments", h.CreateComments)
	api.POST("/groups/:groupId/notices", h.CreateNotice)
	api.DELETE("/groups/:groupId/notices/:period", h.DeleteNotice)
	api.GET("/schedules/:period", h.GetSchedules)

	// PORT is injected by the LWA layer in AWS; defaults to 8080 for local runs.
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	_ = router.Run(":" + port)
}
