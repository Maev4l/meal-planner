
data "aws_sns_topic" "alerting" {
  name = "alerting-events"
}

data "aws_sns_topic" "alerting_responses" {
  name = "alerting-responses"
}
