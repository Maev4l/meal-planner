# Meal Planner — root orchestration targets.
# Target names mirror the former root package.json script names, with ':' -> '-'
# ('-' avoids Make's special treatment of ':'). The root holds no JS
# dependencies; per-package commands are delegated with `make -C` / `yarn --cwd`.

.PHONY: infra-apply infra-output \
        backend-build backend-deploy \
        frontend-build frontend-sync frontend-invalidate frontend-deploy frontend-serve

# --- Infrastructure ---------------------------------------------------------

infra-apply:
	terraform -chdir=packages/infrastructure apply -auto-approve

infra-output:
	terraform -chdir=packages/infrastructure output -json > packages/web-client-v2/output.json

# --- Backend ----------------------------------------------------------------

backend-build:
	$(MAKE) -C packages/functions build

# Build+package the Lambda, then apply infra so the new artifact rolls out.
backend-deploy:
	$(MAKE) -C packages/functions package
	$(MAKE) infra-apply

# --- Frontend ---------------------------------------------------------------

# `infra-output` first so the client build picks up fresh Terraform outputs.
frontend-build: infra-output
	yarn --cwd packages/web-client-v2 build

frontend-sync:
	aws s3 sync packages/web-client-v2/dist s3://$$(terraform -chdir=packages/infrastructure output -raw webclient_bucket) --delete

frontend-invalidate:
	aws cloudfront create-invalidation --path '/*' --distribution-id $$(terraform -chdir=packages/infrastructure output -raw cloudfront_distribution_id)

# Ordered: build -> sync -> invalidate.
frontend-deploy: frontend-build frontend-sync frontend-invalidate

frontend-serve:
	yarn --cwd packages/web-client-v2 dev
