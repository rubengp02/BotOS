# Security policy

## Scope

This repository contains a static synthetic demonstration. It must never contain credentials, personal contact details, real strategy identifiers or parameters, operational data, trading results, or private runtime integrations.

## Reporting

Please use GitHub's private vulnerability reporting for this repository. Do not publish suspected secrets or sensitive details in a public issue.

## Supported version

Only the current default branch is maintained.

## Publication gate

Every change must pass:

```powershell
python tools/validate_public_release.py
python -m unittest discover -s tests -v
```

If the gate reports a possible secret or private identifier, treat the finding as blocking until it is reviewed and removed.
