# Makefile for LangGraph Agent Node.js Backend

.PHONY: help install dev start test lint format clean docker-build docker-run

# Default target
help:
	@echo "Available commands:"
	@echo "  make install      - Install dependencies"
	@echo "  make dev          - Run in development mode with hot reload"
	@echo "  make start        - Run in production mode"
	@echo "  make test         - Run tests"
	@echo "  make lint         - Run linter"
	@echo "  make format       - Format code"
	@echo "  make clean        - Clean generated files"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-run   - Run Docker container"

# Install dependencies
install:
	npm install

# Run in development mode
dev:
	npm run dev

# Run in production mode
start:
	npm start

# Run tests
test:
	npm test

# Run linter
lint:
	npm run lint

# Format code
format:
	npm run format

# Clean generated files
clean:
	rm -rf node_modules
	rm -rf logs
	rm -f package-lock.json
	rm -f yarn.lock
	rm -f pnpm-lock.yaml

# Build Docker image
docker-build:
	docker build -t langgraph-agent-node .

# Run Docker container
docker-run:
	docker run -p 8000:8000 --env-file .env langgraph-agent-node

# Install and run
setup: install
	@echo "Setup complete! Create a .env file based on .env.example and run 'make dev' to start."