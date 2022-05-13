# Godot Setup

![Godot Version](https://img.shields.io/badge/Godot-3.1+-blue.svg)
[![Build](https://github.com/lihop/setup-godot/actions/workflows/demo.yml/badge.svg?event=schedule)](https://github.com/lihop/setup-godot/actions/workflows/demo.yml)

GitHub action to setup the Godot game engine so it can run in graphical mode (i.e. non-headless) on Linux, Windows, and macOS.

This can be useful if you want to test something graphical or platform-specific.

The downloaded Godot executable will is cached for subsequent runs if the `cache` input is set to `true` (default).

## Usage

```yaml
- name: Setup Godot
  uses: lihop/setup-godot@v1.0.0

# You can now run the downloaded version of godot using the `godot` command in your other steps.
# For example, run Gut tests:
- name: Run tests
  shell: bash
  run: godot --no-window -s addons/gut/gut_cmdln.gd -gexit

# You can use the `alias` input if you want to use a different name for the Godot executable
# or use different names for different versions. For example:
- name: Install Godot Mono v3.4-beta5
  uses: lihop/setup-godot@v1.0.0
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
  uses: lihop/setup-godot@v1.0.0
  with:
    version: 3.4.4-stable
    export-templates: true

# Now you can export a run a godot project (this example uses named exports specified in the projects export_presets.cfg file).
- name: Export project
  run: godot --no-window --export "Linux/X11"

# For Linux runners the setup-godot action will start an Xserver and export the DISPLAY environment variable as appropriate.
# This means you can run the exported project without having to set up an Xserver or use `xvfb-run`.
# Windows and macOS runners support graphical applications out of the box.
- name: Run exported project
  run: ./exports/linux.64/MyCoolGame.x86_64
```

## Options

| Name             | Default        | Description                                                                      |
| ---------------- | -------------- | -------------------------------------------------------------------------------- |
| version          | "3.4.4-stable" | Godot version to use                                                             |
| bits             | 64             | 64 or 32 bit build                                                               |
| mono             | false          | Use the Mono build                                                               |
| alias            | "godot"        | Name of the Godot executable that will be added to PATH                          |
| cache            | true           | Whether to save/restore Godot (and export templates if downloaded) to/from cache |
| export-templates | false          | Download export templates                                                        |
