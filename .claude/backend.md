# Meal planner backend

## Design

- Source code: @../packages/api
- The API is an AWS lambda function, written in Golang, leveraging the serverless framework
- The directory structure is vaguely inspired by an hexagonal architecture
- Data storage is ensured by AWS DynamoDB, with a single table design approach
- The members are stored in Cognito, their roles are based on a custom Cognito attribute: "custom:Role"
    - Regular members: attribute value = Regular
    - Admin members: attribute value = AppAmin
- An Open API specs is located in the openapi.yaml file

## Gotchas
- Cognito users identifiers are a uuid, but in the application, it is the same id, but with dash removed and in upper case.
