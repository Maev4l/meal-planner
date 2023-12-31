package helper

import (
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
	"github.com/rs/zerolog/log"
)

func MakeResponse(status int, body interface{}) (*events.APIGatewayProxyResponse, error) {
	resp := events.APIGatewayProxyResponse{Headers: map[string]string{
		"Content-Type": "application/json",
	}}
	resp.StatusCode = status
	if body != nil {
		stringBody, err := json.Marshal(body)
		if err != nil {
			log.Error().Msgf("Failed to marshal response: %v - Error: %s ", body, err.Error())
			return nil, err
		}

		resp.Body = string(stringBody)
	}

	return &resp, nil
}
