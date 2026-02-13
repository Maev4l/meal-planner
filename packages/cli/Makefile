.PHONY: build clean test mod-download mod-tidy mod-verify

LDFLAGS := -s -w
BIN_DIR := bin
BINARY := meal-planner-cli

# Build for current platform
build:
	go build -ldflags="$(LDFLAGS)" -o $(BIN_DIR)/$(BINARY) .

# Remove build artifacts
clean:
	rm -rf $(BIN_DIR)

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
