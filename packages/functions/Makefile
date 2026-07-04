.PHONY: build build-api build-user-onboarding build-user-approval package package-api package-user-onboarding package-user-approval clean test run-api-local

# Build settings for AWS Lambda (ARM64)
GOOS := linux
GOARCH := arm64
LDFLAGS := -s -w

# Build all Lambda binaries
build: build-api build-user-onboarding build-user-approval

# Package all Lambda functions
package: package-api package-user-onboarding package-user-approval

# API function
build-api:
	GOOS=$(GOOS) GOARCH=$(GOARCH) go build -ldflags="$(LDFLAGS)" -o api/bin/bootstrap ./api/cmd/api

package-api: build-api
	mkdir -p api/dist
	cd api/bin && zip ../dist/bootstrap.zip bootstrap

# User Onboarding function
build-user-onboarding:
	GOOS=$(GOOS) GOARCH=$(GOARCH) go build -ldflags="$(LDFLAGS)" -o user-onboarding/bin/bootstrap ./user-onboarding/cmd

package-user-onboarding: build-user-onboarding
	mkdir -p user-onboarding/dist
	cd user-onboarding/bin && zip ../dist/bootstrap.zip bootstrap

# User Approval function
build-user-approval:
	GOOS=$(GOOS) GOARCH=$(GOARCH) go build -ldflags="$(LDFLAGS)" -o user-approval/bin/bootstrap ./user-approval/cmd

package-user-approval: build-user-approval
	mkdir -p user-approval/dist
	cd user-approval/bin && zip ../dist/bootstrap.zip bootstrap

# Remove build artifacts
clean:
	rm -rf api/bin api/dist
	rm -rf user-onboarding/bin user-onboarding/dist
	rm -rf user-approval/bin user-approval/dist

# Run tests for all functions
test:
	go test -v ./...

# Run the API lambda locally as a plain HTTP server (Web Adapter mode).
# Requires AWS credentials in the environment (e.g. `aws sso login`)
# and env vars sourced from api/.env.local (gitignored).
run-api-local:
	@set -a && . ./api/.env.local && set +a && go run ./api/cmd/api
