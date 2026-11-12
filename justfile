# -- Settings ------------------------------------------------------------------

# Use latest version of PowerShell on Windows
set windows-shell := ["pwsh.exe", "-NoLogo", "-Command"]

# -- Variables -----------------------------------------------------------------

api_url := "http://localhost:33215"

# -- Recipes -------------------------------------------------------------------

# Install dependencies (including the ICOClientBase submodule)
[group('setup')]
setup:
	git submodule update --init --recursive
	npm install

# Check types
[group('lint')]
check: setup
	npx vue-tsc --noEmit

# Run tests
[group('test')]
[default]
test *options: check
	npx vitest run {{options}}

# Run development server (with Tailwind watcher)
[group('run')]
run: setup
	npm run start

# Build Tailwind CSS once
[group('build')]
tailwind:
	npx tailwindcss -i ./src/styles/tailwind/tailwind.css -o ./src/styles/tailwind/tailwind-output.css

# Build application for production (output in `dist`)
[group('build')]
build: check tailwind
	npm run build

# Generate API client from the OpenAPI specification of a running ICOapi
[group('build')]
generate-client url=api_url:
	npx openapi-ts --input "{{url}}/openapi.json" --output ./src/client --client fetch

# Release new package version, e.g. `just release 0.2.0` or `just release patch`
[group('release')]
[unix]
release version:
	#!/usr/bin/env sh
	set -e
	npm version {{version}} --no-git-tag-version
	version="$(node -p "require('./package.json').version")"
	git commit -a -m "Release: Release version ${version}"
	git tag "${version}"
	git push
	git push --tags

# Release new package version, e.g. `just release 0.2.0` or `just release patch`
[group('release')]
[windows]
release version:
	#!pwsh
	$ErrorActionPreference = 'Stop'
	npm version {{version}} --no-git-tag-version
	set version "$(node -p "require('./package.json').version")"
	git commit -a -m "Release: Release version ${version}"
	git tag "${version}"
	git push
	git push --tags
