# Python SDK Development Guide

## 📁 Project Structure

```
sdk/python/
├── pyproject.toml        # Dependencies (Poetry)
├── README.md
├── kyrazo/               # Source code
│   ├── client.py         # Main Client
│   ├── core/             # HTTP & Exceptions
│   └── resources/        # API Modules (Events, Sources, etc.)
└── tests/                # Pytest suite
```

## 🚀 Quick Start

1. Install Poetry: https://python-poetry.org/docs/
2. Install dependencies:
   ```bash
   poetry install
   ```

## 🧪 Testing

We use `pytest` for testing and `respx` for mocking HTTP requests.

```bash
# Run all tests
poetry run pytest

# Run with coverage (if configured)
poetry run pytest --cov=kyrazo
```

## 🔧 Code Style

We use `ruff` for linting and formatting.

```bash
# Format code
poetry run ruff format .

# Lint code
poetry run ruff check . --fix
```

## 📝 Adding New Features

1.  **Define Models**: Add Pydantic models in `kyrazo/resources/<module>/models.py`.
    - Must use `model_config = ConfigDict(populate_by_name=True)`.
2.  **Implement Client**: Add methods in `kyrazo/resources/<module>/client.py`.
3.  **Export**: Update `kyrazo/resources/<module>/__init__.py` and `kyrazo/client.py`.
4.  **Test**: Add tests in `tests/`.
5.  **Format**: Run `poetry run ruff format .` and `poetry run ruff check . --fix`.
