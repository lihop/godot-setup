# Godot Setup

![Godot Version](https://img.shields.io/badge/Godot-3.1+-blue.svg)
[![Build](https://github.com/lihop/setup-godot/actions/workflows/demo.yml/badge.svg?event=schedule)](https://github.com/lihop/setup-godot/actions/workflows/demo.yml)

GitHub action to setup the Godot game engine so it can run natively with full platform capabilities on Linux, Windows, and macOS.
This enables testing of visual/graphical features and platform-specific functionality.

**Note:** For Godot 4+ visual testing, only Linux runners currently support graphical mode. Windows and macOS runners can run Godot 4+ but may have limitations with visual features.

## Alternatives

If you only need **headless, export, or platform-agnostic functionality** for CI/CD, consider these popular alternatives:

- **[godot-ci](https://github.com/marketplace/actions/godot-ci)**
- **[Godot Export](https://github.com/marketplace/actions/godot-export)**

## Quick Start

```yaml
- name: Setup Godot
  uses: lihop/setup-godot@v2
  with:
    version: 3.5.3-stable

# You can now run the downloaded version of godot using the `godot` command in your other steps.
# For example, run Gut tests:
- name: Run tests
  shell: bash
  run: godot -s addons/gut/gut_cmdln.gd -gexit
```

## Advanced Usage

```yaml
# You can use the `alias` input if you want to use a different name for the Godot executable
# or use different names for different versions. For example:
- name: Install Godot Mono v3.4-beta5
  uses: lihop/setup-godot@v2
  with:
    mono: true
    version: 3.4-beta5
    alias: my-custom-name

# Now you can execute the Godot version above using `my-custom-name`.
- name: Print version
  run: my-custom-name --version
  # Will print: `3.4.beta5.mono.official.dd0ee4872`.

# You can also download export templates if you plan to export projects.
# The downloaded export templates will be cached along with the Godot executable if the `cache` input is set to `true` (default).
- name: Install Godot 3.4.4-stable
  uses: lihop/setup-godot@v2
  with:
    version: 3.4.4-stable
    export-templates: true

# Now you can export and run a godot project (this example uses named exports specified in the projects export_presets.cfg file).
- name: Export project
  run: godot --no-window --export "Linux/X11"

# For Linux runners the setup-godot action will start an Xserver and export the DISPLAY environment variable as appropriate.
# This means you can run the exported project without having to set up an Xserver or use `xvfb-run`.
# For Windows runners the action will setup OpenGL using [mesa-dist-win](https://github.com/pal1000/mesa-dist-win).
# macOS runners support OpenGL applications out of the box.
- name: Run exported project
  run: ./exports/linux.64/MyCoolGame.x86_64
```

The downloaded Godot executable is cached for subsequent runs if the `cache` input is set to `true` (default).

## Options

| Name             | Default      | Description                                                                      |
| ---------------- | ------------ | -------------------------------------------------------------------------------- |
| version          | "3.5-stable" | Godot version to use                                                             |
| bits             | 64           | 64 or 32 bit build                                                               |
| mono             | false        | Use the Mono build                                                               |
| alias            | "godot"      | Name of the Godot executable that will be added to PATH                          |
| cache            | true         | Whether to save/restore Godot (and export templates if downloaded) to/from cache |
| export-templates | false        | Download export templates                                                        |

## Pre-commit Hook

This repository also provides a pre-commit hook for Godot projects: `check-git-archive`. This hook ensures your repository only includes allowed paths when packaged (useful for Godot Asset Library submissions).

For more information and usage examples, see the [hooks documentation](hooks/README.md).
