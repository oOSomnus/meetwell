package main

import (
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestEmbeddedHandlerServesFrontend(t *testing.T) {
	handler, err := embeddedHandler()
	if err != nil {
		t.Fatalf("embeddedHandler() error = %v", err)
	}

	request := httptest.NewRequest(http.MethodGet, "/", nil)
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("GET / status = %d, want %d", recorder.Code, http.StatusOK)
	}
	body, err := io.ReadAll(recorder.Result().Body)
	if err != nil {
		t.Fatalf("read index response: %v", err)
	}
	if !strings.Contains(string(body), `<div id="root"></div>`) {
		t.Fatalf("index response does not contain the application root")
	}
}

func TestEmbeddedHandlerServesFrontendAsset(t *testing.T) {
	handler, err := embeddedHandler()
	if err != nil {
		t.Fatalf("embeddedHandler() error = %v", err)
	}

	// The Vite asset name is content-hashed, so use the current build's
	// generated entrypoint rather than coupling the test to a hash.
	entries, err := embeddedDist.ReadDir("dist/assets")
	if err != nil {
		t.Fatalf("read embedded assets: %v", err)
	}
	if len(entries) == 0 {
		t.Fatal("embedded assets directory is empty")
	}
	request := httptest.NewRequest(http.MethodGet, "/assets/"+entries[0].Name(), nil)
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("GET asset status = %d, want %d", recorder.Code, http.StatusOK)
	}
}

func TestEmbeddedHandlerReturnsNotFoundForUnknownPath(t *testing.T) {
	handler, err := embeddedHandler()
	if err != nil {
		t.Fatalf("embeddedHandler() error = %v", err)
	}

	request := httptest.NewRequest(http.MethodGet, "/does-not-exist", nil)
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusNotFound {
		t.Fatalf("unknown path status = %d, want %d", recorder.Code, http.StatusNotFound)
	}
}

func TestBrowserURLUsesLoopbackForUnspecifiedAddress(t *testing.T) {
	address := &net.TCPAddr{IP: net.IPv4zero, Port: 43123}
	if got, want := browserURL(address), "http://127.0.0.1:43123"; got != want {
		t.Fatalf("browserURL() = %q, want %q", got, want)
	}
}

func TestBrowserURLPreservesSpecificAddress(t *testing.T) {
	address := &net.TCPAddr{IP: net.ParseIP("127.0.0.1"), Port: 43123}
	if got, want := browserURL(address), "http://127.0.0.1:43123"; got != want {
		t.Fatalf("browserURL() = %q, want %q", got, want)
	}
}
