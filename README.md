# Godot Setup

GitHub action to setup the Godot game engine so it can run in graphical mode (i.e. non-headless) on Linux, Windows, and macOS.

This can be useful if you want to test something graphical or platform-specific.

## Usage

```yaml
- name: Setup Godot
  uses: lihop/setup-godot@v0.1.0

# You can now run the downloaded version of godot using the `godot` command in your other steps.
# For example, run Gut tests:
- name: Run tests
  shell: bash
  run: godot --no-window -s addons/gut/gut_cmdln.gd -gexit

# You can use the `alias` input if you want to use a different name for the Godot executable
# or use different names for different versions. For example:
- name: Install Godot Mono v3.4-beta5
  uses: lihop/setup-godot@v0.1.0
  with:
    mono: true
    version: 3.4-beta5
    alias: my-custom-name

# Now you can execute the Godot version above using `my-custom-name`.
- name: Print version
  run: my-custom-name --version
  # Will print: `3.4.beta5.mono.official.dd0ee4872`.
```

## Options

| Name    | Default      | Description                                             |
| ------- | ------------ | ------------------------------------------------------- |
| version | "3.4-stable" | Godot version to use                                    |
| bits    | 64           | 64 or 32 bit build                                      |
| mono    | false        | Use the Mono build                                      |
| alias   | "godot"      | Name of the Godot executable that will be added to PATH |
| cache   | true         | Whether to save/restore Godot download to/from cache    |
