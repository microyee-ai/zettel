from pathlib import Path
root = Path(__file__).resolve().parents[1]
for name in ["README.md", "LICENSE", "AGENTS.md", "CONTRIBUTING.md", "SECURITY.md", "GOVERNANCE.md", "CODE_OF_CONDUCT.md", "docs/product-research.md"]:
    assert (root / name).is_file(), f"Missing {name}"
assert "Apache License" in (root / "LICENSE").read_text()
print("Planning artifacts validated. Run npm test, npm run build and npm run test:e2e for application checks.")

import tomllib
config = tomllib.loads((root / ".codex/config.toml").read_text())
assert config["agents"]["enabled"] is True
names = set()
for path in (root / ".codex/agents").glob("*.toml"):
    role = tomllib.loads(path.read_text())
    for field in ("name", "description", "developer_instructions"):
        assert isinstance(role.get(field), str) and role[field].strip(), f"Missing {field}: {path}"
    assert role["name"] not in names, "Duplicate agent name"
    names.add(role["name"])
import json
roster = json.loads((root / ".codex/roster.json").read_text())
assert names == set(roster["agents"]), "Agent files and reviewed roster differ"
print("Project agent configuration validated.")
