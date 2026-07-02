# Project MEAL-PLANNER

This application allow people to configure their attendance to meals.
People belongs to groups and they can apply for lunches or dinners on a weekly basis.
In addition, for each meal, they can attach a comment.

## Design
- The UI is a React-based PWA styled with Tailwind CSS v4 (dark "Ardoise" chalkboard theme; no MUI): @ui.md.
- The backend is AWS Lambda written in Golang: @backend.md.
- Infrastructure is managed with Terraform: @../packages/infrastructure
- Everything is deployed on AWS.
- The project is a monorepo. It does NOT use yarn workspaces: each JS package
  manages its own `node_modules` / `yarn.lock`. Run package commands with
  `yarn --cwd packages/<pkg> ...`. Root-level orchestration lives in a `Makefile`
  (targets mirror the old npm script names with `:` replaced by `-`, e.g.
  `make frontend-serve`, `make backend-deploy`); there is no root `package.json`.

## Guidelines
- Update the md files according to changes:
  - @ui.md for frontend
  - @backend.md for API
  - @cli.md for CLI
