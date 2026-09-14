SHELL := /bin/sh

GOOS ?= $(shell go env GOOS)
GOARCH ?= $(shell go env GOARCH)
OUTPUT_DIR ?= bin
BINARY := $(OUTPUT_DIR)/meetwell-$(GOOS)-$(GOARCH)$(if $(filter windows,$(GOOS)),.exe,)

.PHONY: help dev run build test package standalone package-all clean

help:
	@printf '%s\n' \
		'Usage: make <target>' \
		'' \
		'Targets:' \
		'  dev          Start the Vite development server' \
		'  run          Build and run the standalone binary' \
		'  build        Build the frontend' \
		'  test         Run frontend and Go tests' \
		'  package      Build a standalone binary for the current target' \
		'  package-all  Build standalone binaries for common targets' \
		'  clean        Remove generated frontend and binary artifacts' \
		'' \
		'Variables:' \
		'  ADDR=127.0.0.1:8080  Address used by make run' \
		'  GOOS=linux GOARCH=amd64  Cross-compile with make package' \
		'  OUTPUT_DIR=release      Change the binary output directory'

dev:
	npm run dev

run: package
	$(BINARY) $(if $(ADDR),--addr $(ADDR),)

build:
	npm run build

test:
	npm test
	go test ./...

package: build
	MEETWELL_OUTPUT_DIR=$(OUTPUT_DIR) GOOS=$(GOOS) GOARCH=$(GOARCH) sh scripts/build-standalone.sh

standalone: package

package-all: build
	MEETWELL_OUTPUT_DIR=$(OUTPUT_DIR) sh scripts/build-standalone-all.sh

clean:
	rm -rf dist $(OUTPUT_DIR)
