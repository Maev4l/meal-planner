.PHONY: build build-api build-user-management package package-api package-user-management clean test

# Build settings for AWS Lambda (ARM64)
GOOS := linux
GOARCH := arm64
LDFLAGS := -s -w

# Build all Lambda binaries
build: build-api build-user-management

# Package all Lambda functions
package: package-api package-user-management

# API function
build-api:
	GOOS=$(GOOS) GOARCH=$(GOARCH) go build -ldflags="$(LDFLAGS)" -o api/bin/bootstrap ./api/cmd/api

package-api: build-api
	mkdir -p api/dist
	cd api/bin && zip ../dist/bootstrap.zip bootstrap

# User Management function
build-user-management:
	GOOS=$(GOOS) GOARCH=$(GOARCH) go build -ldflags="$(LDFLAGS)" -o user-management/bin/bootstrap ./user-management/cmd

package-user-management: build-user-management
	mkdir -p user-management/dist
	cd user-management/bin && zip ../dist/bootstrap.zip bootstrap

# Remove build artifacts
clean:
	rm -rf api/bin api/dist
	rm -rf user-management/bin user-management/dist

# Run tests for all functions
test:
	go test -v ./...
