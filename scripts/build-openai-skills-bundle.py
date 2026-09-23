#!/usr/bin/env python3
"""Build a deterministic Skills ZIP from the versioned plugin distribution.

For a With MCP submission, configure the remote MCP in the portal. This ZIP
keeps the full skill/resource layout but excludes local host configuration.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

DEFAULT_SOURCE = Path(__file__).resolve().parents[1] / "dist/yeeflow-app-builder-plugin"
EXCLUDED = {".mcp.json", "mcp.json", ".app.json", "skills/.DS_Store"}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    source = args.source.resolve(strict=True)
    original = json.loads((source / ".codex-plugin/plugin.json").read_text())
    version = original.get("version")
    if not isinstance(version, str) or not version:
        raise SystemExit("The source plugin must have a manifest version")

    entries: dict[str, bytes] = {}
    for path in source.rglob("*"):
        if path.is_symlink():
            raise SystemExit(f"Symlink is not allowed: {path}")
        if not path.is_file():
            continue
        name = path.relative_to(source).as_posix()
        if name in EXCLUDED or name.startswith(".codex-plugin/"):
            continue
        entries[name] = path.read_bytes()

    manifest = dict(original)
    manifest["version"] = version
    manifest.pop("mcpServers", None)
    entries[".codex-plugin/plugin.json"] = (
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    ).encode("utf-8")
    skills = sorted(
        name for name in entries if name.startswith("skills/") and name.endswith("/SKILL.md")
    )
    if len(skills) != 27:
        raise SystemExit(f"Expected 27 skills; found {len(skills)}")

    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    archive_path = output / f"yeeflow-skills-bundle-{version}.zip"
    if archive_path.exists():
        raise SystemExit(f"Archive already exists; refusing overwrite: {archive_path}")
    with ZipFile(archive_path, "w", compression=ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data in sorted(entries.items()):
            info = ZipInfo(name, date_time=(2026, 9, 23, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data, compress_type=ZIP_DEFLATED, compresslevel=9)

    inventory = {
        "status": "local-candidate-not-uploaded",
        "source": str(source),
        "sourceVersion": version,
        "candidateVersion": version,
        "archive": str(archive_path),
        "archiveSha256": sha256(archive_path.read_bytes()),
        "compressedBytes": archive_path.stat().st_size,
        "uncompressedBytes": sum(len(data) for data in entries.values()),
        "entryCount": len(entries),
        "skillCount": len(skills),
        "skills": skills,
        "files": {name: sha256(data) for name, data in sorted(entries.items())},
    }
    (output / "inventory.json").write_text(json.dumps(inventory, indent=2) + "\n")
    print(json.dumps({key: inventory[key] for key in (
        "archive", "archiveSha256", "compressedBytes", "uncompressedBytes", "entryCount", "skillCount"
    )}, indent=2))


if __name__ == "__main__":
    main()
