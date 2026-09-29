#!/usr/bin/env python3
"""Materialize the pinned, verified Brain references without network access."""
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import stat
import zipfile


def main():
    root = Path(__file__).resolve().parent
    manifest = json.loads((root / "manifest.json").read_text())
    archive = (root / "reference-bundle.zip").read_bytes()
    if hashlib.sha256(archive).hexdigest() != manifest["archive_sha256"]:
        raise ValueError("Archive SHA256 differs from the pinned manifest")
    destination = root / "reference"
    if destination.is_symlink():
        raise ValueError("Reference destination must not be a symlink")
    expected = {entry["path"]: entry for entry in manifest["files"]}
    if len(expected) != len(manifest["files"]):
        raise ValueError("Duplicate manifest paths")
    staged = []
    with zipfile.ZipFile(io.BytesIO(archive)) as bundle:
        names = bundle.namelist()
        if len(names) != len(set(names)) or set(names) != set(expected):
            raise ValueError("Archive entries differ from the manifest")
        for info in bundle.infolist():
            relative = PurePosixPath(info.filename)
            if relative.is_absolute() or ".." in relative.parts or "\\" in info.filename:
                raise ValueError("Unsafe archive path")
            if not stat.S_ISREG(info.external_attr >> 16):
                raise ValueError("Only regular files are supported")
            target = destination.joinpath(*relative.parts)
            for parent in [target, *target.parents]:
                if parent == root:
                    break
                if parent.is_symlink():
                    raise ValueError(f"Symlink in extraction path: {parent}")
            content = bundle.read(info)
            entry = expected[info.filename]
            if len(content) != entry["size"] or hashlib.sha256(content).hexdigest() != entry["sha256"]:
                raise ValueError(f"Invalid content: {info.filename}")
            blob = b"blob " + str(len(content)).encode() + b"\0" + content
            if hashlib.sha1(blob).hexdigest() != entry["git_blob_sha1"]:
                raise ValueError(f"Invalid Git blob: {info.filename}")
            if target.exists() and (not target.is_file() or target.read_bytes() != content):
                raise ValueError(f"Refusing to replace modified reference: {target}")
            staged.append((target, content))
    # All entries and existing targets are checked before writing any file.
    for target, content in staged:
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists():
            target.write_bytes(content)
    print(f"Verified {len(staged)} files; Brain commit {manifest['source_commit']}")
    print(destination)


if __name__ == "__main__":
    main()
