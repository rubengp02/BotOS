"""Fail-closed checks for the isolated public BotOS demonstration."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data" / "demo_portfolio.json"

FORBIDDEN_SUFFIXES = {
    ".db",
    ".ex5",
    ".log",
    ".mq5",
    ".mqh",
    ".patch",
    ".set",
    ".sqlite",
    ".sqlite3",
    ".xml",
    ".zip",
}

FORBIDDEN_NAMES = {
    "mt5_credentials.json",
    "portfolio_state.json",
    "live_terminal_sync.json",
    "optimizations.db",
}

# Private identifiers check is handled locally outside this public repo to avoid leaking them.
PRIVATE_IDENTIFIERS = ()

SECRET_PATTERNS = {
    "email address": re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE),
    "GitHub token": re.compile(r"\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b"),
    "OpenAI-style key": re.compile(r"\bsk-[A-Za-z0-9_-]{20,}\b"),
    "AWS access key": re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    "private key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "assigned secret": re.compile(
        r"\b(?:password|passwd|api[_-]?key|secret|access[_-]?token)\s*[:=]\s*['\"][^'\"]{8,}['\"]",
        re.IGNORECASE,
    ),
    "bearer token": re.compile(r"\bBearer\s+[A-Za-z0-9._~-]{16,}\b", re.IGNORECASE),
    "personal Windows path": re.compile(r"\b[A-Z]:\\Users\\[^\\\s]+", re.IGNORECASE),
}

TEXT_SUFFIXES = {".css", ".html", ".js", ".json", ".md", ".toml", ".txt", ".yml", ".yaml"}
SCAN_EXCLUSIONS = {
    Path("tools/validate_public_release.py"),
    Path("tests/test_public_release.py"),
}
ALLOWED_WEB_HOSTS = {
    "cdn.jsdelivr.net",
    "cdn.tailwindcss.com",
    "fonts.googleapis.com",
    "fonts.gstatic.com",
    "github.com",
    "img.shields.io",
    "localhost",
    "rubengp02.github.io",
    "unpkg.com",
}

LOCAL_QA_ARTIFACTS = {
    "desktop-demo.png",
    "mobile-demo.png",
    "mobile-demo-final.png",
    "mobile-500.png",
}


def repository_files() -> list[Path]:
    files: list[Path] = []
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        relative = path.relative_to(ROOT)
        if ".git" in relative.parts or "__pycache__" in relative.parts:
            continue
        if any(part.startswith(".edge-") for part in relative.parts):
            continue
        if relative.name in LOCAL_QA_ARTIFACTS:
            continue
        files.append(path)
    return files


def validate_file_inventory(files: list[Path]) -> list[str]:
    errors: list[str] = []
    for path in files:
        relative = path.relative_to(ROOT)
        if path.suffix.lower() in FORBIDDEN_SUFFIXES:
            errors.append(f"forbidden operational extension: {relative}")
        if path.name.lower() in FORBIDDEN_NAMES:
            errors.append(f"forbidden operational file: {relative}")
        if path.is_symlink():
            errors.append(f"symbolic links are not allowed in the public release: {relative}")
    return errors


def validate_text_content(files: list[Path]) -> list[str]:
    errors: list[str] = []
    for path in files:
        relative = path.relative_to(ROOT)
        if relative in SCAN_EXCLUSIONS or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        text = path.read_text(encoding="utf-8")
        for label, pattern in SECRET_PATTERNS.items():
            if pattern.search(text):
                errors.append(f"possible {label}: {relative}")
        for identifier in PRIVATE_IDENTIFIERS:
            if identifier.casefold() in text.casefold():
                errors.append(f"private strategy identifier '{identifier}' found in {relative}")
    return errors


def validate_network_boundary() -> list[str]:
    errors: list[str] = []
    
    js_files = list((ROOT / "js").rglob("*.js"))
    for js_path in js_files:
        app_text = js_path.read_text(encoding="utf-8")
        for forbidden in ("127.0.0.1", "localhost", "/api/", "WebSocket"):
            if forbidden.casefold() in app_text.casefold():
                errors.append(f"public JavaScript contains forbidden runtime reference in {js_path.name}: {forbidden}")

    for path in (ROOT / "index.html", ROOT / "README.md"):
        if not path.exists(): continue
        text = path.read_text(encoding="utf-8")
        for raw_url in re.findall(r"https?://[^\s\"')>]+", text):
            hostname = urlparse(raw_url).hostname
            if hostname not in ALLOWED_WEB_HOSTS:
                errors.append(
                    f"unauthorized external host '{hostname}' in {path.relative_to(ROOT)}"
                )
    return errors


def validate_demo_dataset() -> list[str]:
    errors: list[str] = []
    payload = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    dataset = payload.get("dataset", {})
    if dataset.get("kind") != "synthetic":
        errors.append("dataset.kind must be 'synthetic'")
    if not isinstance(dataset.get("seed"), int):
        errors.append("dataset.seed must be an integer")

    strategies = payload.get("strategies")
    if not isinstance(strategies, list) or not strategies:
        return [*errors, "strategies must be a non-empty list"]

    identifiers: set[str] = set()
    names: set[str] = set()
    for strategy in strategies:
        identifier = strategy.get("id", "")
        name = strategy.get("name", "")
        market = strategy.get("market", "")
        if not identifier.startswith("DEMO-"):
            errors.append(f"strategy id is outside DEMO namespace: {identifier!r}")
        if not market.startswith("SYN-"):
            errors.append(f"market is outside SYN namespace: {market!r}")
        if identifier in identifiers:
            errors.append(f"duplicate strategy id: {identifier}")
        if name in names:
            errors.append(f"duplicate strategy name: {name}")
        identifiers.add(identifier)
        names.add(name)

        for field in ("score", "stability", "allocation_pct"):
            value = strategy.get(field)
            if not isinstance(value, (int, float)) or not 0 <= value <= 100:
                errors.append(f"{identifier}.{field} must be between 0 and 100")

    active_allocation = sum(item["allocation_pct"] for item in strategies)
    if active_allocation != 100:
        errors.append(f"synthetic allocation must total 100, got {active_allocation}")

    correlation = payload.get("correlation", {})
    labels = correlation.get("labels", [])
    matrix = correlation.get("matrix", [])
    if len(matrix) != len(labels) or any(len(row) != len(labels) for row in matrix):
        errors.append("correlation matrix must be square and match its labels")
    return errors


def validate_required_markers() -> list[str]:
    errors: list[str] = []
    index_text = (ROOT / "index.html").read_text(encoding="utf-8")
    readme_text = (ROOT / "README.md").read_text(encoding="utf-8")
    required = {
        "index.html": ("PUBLIC DEMO", "SYNTHETIC / NO LIVE DATA", "data/demo_portfolio.json"),
        "README.md": ("Public Synthetic Demo", "datos sinteticos", "synthetic data"),
    }
    for file_name, markers in required.items():
        text = index_text if file_name == "index.html" else readme_text
        for marker in markers:
            if marker.casefold() not in text.casefold():
                errors.append(f"required public marker {marker!r} missing from {file_name}")
    return errors


def run_validation() -> list[str]:
    files = repository_files()
    return [
        *validate_file_inventory(files),
        *validate_text_content(files),
        *validate_network_boundary(),
        *validate_demo_dataset(),
        *validate_required_markers(),
    ]


def main() -> int:
    errors = run_validation()
    if errors:
        print("Public release validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    print("Public release validation passed: synthetic-only boundary is intact.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
