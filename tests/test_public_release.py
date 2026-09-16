from __future__ import annotations

import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VALIDATOR_PATH = ROOT / "tools" / "validate_public_release.py"


def load_validator():
    spec = importlib.util.spec_from_file_location("public_release_validator", VALIDATOR_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("Could not load public release validator")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class PublicReleaseContractTests(unittest.TestCase):
    def test_publication_gate_passes(self) -> None:
        validator = load_validator()
        self.assertEqual([], validator.run_validation())

    def test_dataset_is_explicitly_synthetic(self) -> None:
        payload = json.loads((ROOT / "data" / "demo_portfolio.json").read_text(encoding="utf-8"))
        self.assertEqual("synthetic", payload["dataset"]["kind"])
        self.assertTrue(all(item["id"].startswith("DEMO-") for item in payload["strategies"]))
        self.assertTrue(all(item["market"].startswith("SYN-") for item in payload["strategies"]))

    def test_frontend_has_no_private_runtime_endpoint(self) -> None:
        for js_path in (ROOT / "js").rglob("*.js"):
            script = js_path.read_text(encoding="utf-8").casefold()
            for forbidden in ("127.0.0.1", "localhost", "/api/", "websocket"):
                self.assertNotIn(forbidden, script)

    def test_static_entrypoint_reuses_public_dashboard_contract(self) -> None:
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn("derived from dashboard_portfolio_quant.html", html)
        self.assertIn("PUBLIC DEMO", html)


if __name__ == "__main__":
    unittest.main()
