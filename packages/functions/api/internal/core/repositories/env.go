package repositories

import "os"

var region string = os.Getenv("REGION")
var tableName string = os.Getenv("DYNAMODB_TABLE_NAME")
var userPoolId string = os.Getenv("USER_POOL_ID")
