.PHONY: build build-api build-authorizer build-local clean test mod-download mod-tidy mod-verify

# Build settings for AWS Lambda (ARM64)
GOOS := linux
GOARCH := arm64
LDFLAGS := -s -w

# Output directory
BIN_DIR := bin

# Package directory
PACKAGE_DIR := dist

# Build all Lambda binaries
build: build-api

# Package all Lambda
package: package-api

# Build API handler for Lambda
build-api:
	GOOS=$(GOOS) GOARCH=$(GOARCH) go build -ldflags="$(LDFLAGS)" -o $(BIN_DIR)/bootstrap ./cmd/api

# Package API handler for Lambda
package-api: build-api
	mkdir -p $(PACKAGE_DIR)
	cd $(BIN_DIR) && zip ../$(PACKAGE_DIR)/bootstrap.zip bootstrap

# Remove build artifacts
clean:
	rm -rf $(BIN_DIR)
	rm -rf dist
	rm -rf .serverless

# Run tests
test:
	go test -v ./...

# Download dependencies
mod-download:
	go mod download

# Tidy dependencies
mod-tidy:
	go mod tidy

# Verify dependencies
mod-verify:
	go mod verify
