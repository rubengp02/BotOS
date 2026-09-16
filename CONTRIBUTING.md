# Contributing

BotOS Public Demo is a personal portfolio project. Small fixes that preserve the synthetic-only boundary are welcome.

Before opening a pull request:

1. Do not add real strategies, parameters, results, exports, logs, accounts, or credentials.
2. Keep all model IDs under the `DEMO-` namespace and all fictional markets under `SYN-`.
3. Run `python tools/validate_public_release.py`.
4. Run `python -m unittest discover -s tests -v`.
5. Describe visible behavior and include screenshots for UI changes.

Security findings must be reported privately as described in [SECURITY.md](SECURITY.md).
