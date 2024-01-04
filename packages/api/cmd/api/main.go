package main

import (
	"context"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	ginadapter "github.com/awslabs/aws-lambda-go-api-proxy/gin"
	"github.com/gin-gonic/gin"
	"isnan.eu/meal-planner/api/internal/core/handlers"
	"isnan.eu/meal-planner/api/internal/core/repositories"
	"isnan.eu/meal-planner/api/internal/core/services"
)

var ginLambda *ginadapter.GinLambda

func init() {

	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	r := repositories.NewDynamoDB()
	c := repositories.NewCognito()
	s := services.New(r, c)
	h := handlers.NewHTTPHandler(s)

	router.POST("/api/tenants", h.CreateTenant)

	router.GET("/api/members/:id", func(c *gin.Context) {

		c.JSON(200, gin.H{
			"id": c.Param("id"),
			// "q":  c.Query("q"),

		})
	})

	ginLambda = ginadapter.New(router)
}

func handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// If no name is provided in the HTTP request body, throw an error
	return ginLambda.ProxyWithContext(ctx, req)
}
func main() {
	lambda.Start(handler)
}
