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
  `yarn --cwd packages/<pkg> ...`; the root `package.json` holds only NPM scripts
  and declares no dependencies.

## Guidelines
- Update the md files according to changes:
  - @ui.md for frontend
  - @backend.md for API
  - @cli.md for CLI
