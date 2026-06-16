package helper

import (
	"regexp"
	"testing"
)

func TestNewInviteCode(t *testing.T) {
	code := NewInviteCode()

	// 128-bit, reusing the UUID source, normalized like the app's other ids:
	// 32 uppercase hex characters, no dashes.
	if !regexp.MustCompile(`^[0-9A-F]{32}$`).MatchString(code) {
		t.Fatalf("code %q is not 32 uppercase hex chars", code)
	}
}

func TestNewInviteCodeIsUnique(t *testing.T) {
	seen := map[string]bool{}
	for i := 0; i < 1000; i++ {
		c := NewInviteCode()
		if seen[c] {
			t.Fatalf("duplicate code generated: %q", c)
		}
		seen[c] = true
	}
}
