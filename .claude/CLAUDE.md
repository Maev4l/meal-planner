# Project MEAL-PLANNER

This application allow people to configure their attendance to meals.
People belongs to groups and they can apply for lunches or dinners on a weekly basis.
In addition, for each meal, they can attach a comment.

## Design
- Durable product truth (users, purpose, positioning, brand commitments): @../PRODUCT.md.
- The visual design system — tokens, typography, components, named rules (the "Ardoise"
  chalkboard world): @../DESIGN.md. Machine-readable extensions (tonal ramps, motion,
  component snippets) live alongside it in `.impeccable/design.json`.
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
  - @../DESIGN.md when the visual system itself changes (tokens, typography, a new
    primitive, a new rule) — keep `.impeccable/design.json` in sync with it
  - @../PRODUCT.md only when durable product truth changes; never for visual decisions
