# Godot Setup

![Godot Version](https://img.shields.io/badge/Godot-4.0+-blue.svg)
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
  uses: lihop/setup-godot@v3
  with:
    version: 4.3-stable

# You can now run the downloaded version of godot using the `godot` command in your other steps.
# For example, run Gut tests:
- name: Run tests
  shell: bash
  run: godot --headless -s addons/gut/gut_cmdln.gd --quit
```

## Advanced Usage

```yaml
# You can use the `alias` input if you want to use a different name for the Godot executable
# or use different names for different versions. For example:
- name: Install Godot Mono v4.3-stable
  uses: lihop/setup-godot@v3
  with:
    mono: true
    version: 4.3-stable
    alias: my-custom-name

# Now you can execute the Godot version above using `my-custom-name`.
- name: Print version
  run: my-custom-name --version
  # Will print: `4.3.stable.mono.official.77dcf97d7`.

# You can also download export templates if you plan to export projects.
# The downloaded export templates will be cached along with the Godot executable if the `cache` input is set to `true` (default).
- name: Install Godot 4.3-stable
  uses: lihop/setup-godot@v3
  with:
    version: 4.3-stable
    export-templates: true

# Now you can export and run a godot project (this example uses named exports specified in the projects export_presets.cfg file).
- name: Export project
  run: godot --headless --export-release "Linux/X11"

# For Linux runners the setup-godot action will start an Xserver and export the DISPLAY environment variable as appropriate.
# This means you can run the exported project without having to set up an Xserver or use `xvfb-run`.
# For Windows runners the action will setup OpenGL using [mesa-dist-win](https://github.com/pal1000/mesa-dist-win).
# macOS runners support OpenGL applications out of the box.
- name: Run exported project
  run: ./exports/linux.x86_64/MyCoolGame.x86_64
```

The downloaded Godot executable is cached for subsequent runs if the `cache` input is set to `true` (default).

## Options

| Name             | Default      | Description                                                                      |
| ---------------- | ------------ | -------------------------------------------------------------------------------- |
| version          | "4.3-stable" | Godot version to use                                                             |
| arch             | <detected>   | Target architecture (x86_64, arm64, x86_32, arm32)                               |
| mono             | false        | Use the Mono build                                                               |
| alias            | "godot"      | Name of the Godot executable that will be added to PATH                          |
| cache            | true         | Whether to save/restore Godot (and export templates if downloaded) to/from cache |
| export-templates | false        | Download export templates                                                        |
