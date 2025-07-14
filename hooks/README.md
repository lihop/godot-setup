# Pre-commit Hooks

This repository provides pre-commit hooks for Godot projects.

## Available Hooks

### check-git-archive

Ensures that `git archive` only contains the specified allowed paths. This is useful for Godot addons to ensure that only the addon directory is included when the repository is packaged for distribution (e.g., for the Godot Asset Library).

**Usage:**

```yaml
repos:
  - repo: https://github.com/lihop/setup-godot
    rev: hooks-v1.0.0
    hooks:
      - id: check-git-archive
        args: [addons/my_addon]
```

**Arguments:**

- One or more paths that should be allowed in the git archive
- Example: `addons/my_addon` for a single addon
- Example: `addons/my_addon examples/examples.tscn` for an addon plus example scene

**What it checks:**

- Git archive contains only the specified paths
- No unexpected files or directories at the root level
- All specified paths exist in the archive

**What it suggests:**

- Minimal `.gitattributes` export-ignore rules to fix issues
- Only suggests top-level ignores (e.g., `/unwanted_dir export-ignore` instead of individual files)

**Cross-platform:**

- Written in Python for maximum portability
- Works on Windows, macOS, and Linux
- Requires `git` to be available in PATH
