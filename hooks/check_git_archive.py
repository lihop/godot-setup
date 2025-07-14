#!/usr/bin/env python3

"""
Check that git archive only contains specified allowed paths.
This hook ensures the repository is properly configured for distribution.

Usage: check-git-archive.py [path1] [path2] [...]
Example: check-git-archive.py addons/my_addon
Example: check-git-archive.py addons/my_addon docs/README.md
"""

import argparse
import os
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path
from typing import List, Set


def create_git_archive() -> bytes:
    """Create git archive from staged files (index)."""
    try:
        # Get tree hash from staged files
        tree_hash = (
            subprocess.check_output(["git", "write-tree"], stderr=subprocess.DEVNULL)
            .decode()
            .strip()
        )

        # Create archive from tree in zip format
        archive_data = subprocess.check_output(
            ["git", "archive", "--format=zip", tree_hash], stderr=subprocess.DEVNULL
        )
        return archive_data
    except subprocess.CalledProcessError as e:
        print(f"Error creating git archive: {e}")
        sys.exit(1)


def extract_archive(archive_data: bytes, extract_dir: Path) -> None:
    """Extract zip archive to directory."""
    with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as tmp_file:
        tmp_file.write(archive_data)
        tmp_file.flush()

        try:
            with zipfile.ZipFile(tmp_file.name, "r") as zip_ref:
                zip_ref.extractall(extract_dir)
        finally:
            os.unlink(tmp_file.name)


def get_all_files(extract_dir: Path) -> List[str]:
    """Get all files in the extracted archive (not directories)."""
    files = []
    for item in extract_dir.rglob("*"):
        if item.is_file():
            # Get relative path from extract_dir
            rel_path = item.relative_to(extract_dir)
            files.append(str(rel_path).replace("\\", "/"))  # Normalize path separators
    return files


def is_path_allowed(path: str, allowed_paths: List[str]) -> bool:
    """Check if a path is allowed (exact match or under an allowed directory)."""
    for allowed in allowed_paths:
        # Normalize path separators
        allowed = allowed.replace("\\", "/")
        path = path.replace("\\", "/")

        # Exact match
        if path == allowed:
            return True
        # Path is under an allowed directory
        if path.startswith(allowed + "/"):
            return True
    return False


def is_parent_of_allowed(path: str, allowed_paths: List[str]) -> bool:
    """Check if path is a parent directory of any allowed path."""
    for allowed in allowed_paths:
        # Normalize path separators
        allowed = allowed.replace("\\", "/")
        path = path.replace("\\", "/")

        if allowed.startswith(path + "/"):
            return True
    return False


def get_minimal_ignores(unexpected_files: List[str]) -> List[str]:
    """Get minimal set of top-level paths to ignore."""
    top_levels = set()
    for file_path in unexpected_files:
        # Get the top-level path (first component)
        top_level = file_path.split("/")[0]
        top_levels.add(top_level)
    return sorted(top_levels)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "allowed_paths", nargs="+", help="Allowed paths in the git archive"
    )

    args = parser.parse_args()

    if not args.allowed_paths:
        print("Error: No allowed paths specified.")
        return 1

    # Create temporary directory for extraction
    with tempfile.TemporaryDirectory() as temp_dir:
        extract_dir = Path(temp_dir) / "unzipped"
        extract_dir.mkdir()

        # Create and extract git archive
        archive_data = create_git_archive()
        extract_archive(archive_data, extract_dir)

        # Get all files in archive
        all_files = get_all_files(extract_dir)

        # Find unexpected files
        unexpected_files = []
        for file_path in all_files:
            if not is_path_allowed(
                file_path, args.allowed_paths
            ) and not is_parent_of_allowed(file_path.split("/")[0], args.allowed_paths):
                unexpected_files.append(file_path)

        if unexpected_files:
            print("git archive contains unexpected files:")
            for file_path in unexpected_files:
                print(f"  \033[31m{file_path}\033[0m")  # Red color
            print()
            print("add these lines to .gitattributes to fix:")

            minimal_ignores = get_minimal_ignores(unexpected_files)
            for ignore_path in minimal_ignores:
                print(f"\033[32m/{ignore_path} export-ignore\033[0m")  # Green color
            return 1

        # Verify all allowed paths exist
        missing_paths = []
        for allowed in args.allowed_paths:
            allowed_path = extract_dir / allowed
            if not allowed_path.exists():
                missing_paths.append(allowed)

        if missing_paths:
            print("Git archive missing required paths:")
            for path in missing_paths:
                print(f"  {path}")
            return 1

    print("✓ Git archive validation passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
