SHELL := /bin/zsh
.PHONY: help install dev run test clean format lint setup

# Default target
help:
	@echo "Available commands:"
	@echo "  setup      - Set up the development environment"
	@echo "  install    - Install dependencies"
	@echo "  dev        - Install development dependencies"
	@echo "  run        - Run the application"
	@echo "  test       - Run tests"
	@echo "  format     - Format code with black"
	@echo "  lint       - Run linting checks"
	@echo "  clean      - Clean up temporary files"
	

# Set up the development environment
setup:
	@echo "Setting up development environment..."
	python3 -m venv venv
	@echo "Virtual environment created. Activate it with:"
	@echo "  source venv/bin/activate  # On macOS/Linux"
	@echo "  venv\\Scripts\\activate     # On Windows"
	@echo "Then run 'make install' to install dependencies."

# Install dependencies
install:
	pip install --upgrade pip
	pip install -r requirements.txt

# Install development dependencies
dev: install
	pip install black flake8 isort

# Run the application
run:
	@echo "Starting MediumPublisher application..."
	@echo "Open http://localhost:8000 in your browser"
	venv/bin/python main.py

# Run the application with uvicorn (development mode)
dev-run:
	uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run tests
test:
	@echo "No tests configured yet"

# Format code
format:
	@echo "Formatting code with black..."
	black . --line-length=120
	isort . --profile=black

# Run linting
lint:
	@echo "Running linting checks..."
	flake8 . --exclude=venv,__pycache__,.git,.tox,.eggs,build,dist,*.egg-info --max-line-length=120 --extend-ignore=E203,W503,E501
	black . --check --line-length=120
	isort . --check-only --profile=black

# Clean up temporary files
clean:
	@echo "Cleaning up temporary files..."
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.pyd" -delete
	find . -type f -name ".coverage" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
	rm -rf build/
	rm -rf dist/
	rm -rf exports/*.html exports/*.md exports/*.txt
