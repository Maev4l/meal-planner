# Project MEAL-PLANNER

This application allow people to configure their attendance to meals.
People belongs to groups and they can apply for lunches or dinners on a weekly basis.
In addition, for each meal, they can attach a comment.

## Design
- The UI is a React based application, based on MUI (Material UI): @ui.md.
- The backend is AWS Lamdba written in Golang: @backend.md.
- Everything is deployed on AWS.
- The project is a monorepo based on yarn workspaces.
- This project relies on serverless framework (including serverless compose)

## Guidelines
- Update the md files according to changes:
  - @ui.md for frontend
  - @backend.md for API
  - @cli.md for CLI
