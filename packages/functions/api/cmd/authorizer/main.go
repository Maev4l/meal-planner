package main

import (
	"context"
	"fmt"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/lestrrat-go/jwx/jwk"
	"github.com/lestrrat-go/jwx/jwt"
	"github.com/rs/zerolog/log"
)

var cognitoUrl string = os.Getenv("COGNITO_URL")
var clientId string = os.Getenv("CLIENT_ID")
var issuer string = os.Getenv("TOKEN_ISSUER")

func generatePolicy(effect string, principal string, resource string) *events.APIGatewayCustomAuthorizerResponse {
	authResponse := events.APIGatewayCustomAuthorizerResponse{PrincipalID: principal}
	if effect != "" && resource != "" {
		authResponse.PolicyDocument = events.APIGatewayCustomAuthorizerPolicy{
			Version: "2012-10-17",
			Statement: []events.IAMPolicyStatement{
				{
					Action:   []string{"execute-api:Invoke"},
					Effect:   effect,
					Resource: []string{resource},
				},
			},
		}
	}
	return &authResponse

}

func handler(ctx context.Context, event events.APIGatewayCustomAuthorizerRequest) (*events.APIGatewayCustomAuthorizerResponse, error) {

	set, err := jwk.Fetch(ctx, cognitoUrl)
	if err != nil {
		log.Error().Msgf("Failed to fetch JWKS from %s: %s", cognitoUrl, err.Error())
		return generatePolicy("deny", "", event.MethodArn), nil
	}

	token, err := jwt.Parse([]byte(event.AuthorizationToken),
		jwt.WithKeySet(set),
		jwt.WithValidate(true),
		jwt.WithAudience(clientId),
		jwt.WithClaimValue("token_use", "id"),
		jwt.WithIssuer(issuer))

	if err != nil {
		log.Error().Msgf("Failed to parse token: %s", err.Error())
		return generatePolicy("deny", "", event.MethodArn), nil
	}
	username, _ := token.Get("cognito:username")
	return generatePolicy("allow", fmt.Sprintf("%v", username), event.MethodArn), nil

}

func main() {
	lambda.Start(handler)
}
