# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/lihop/setup-godot/compare/v2.1.6...HEAD)

## [v2.1.6](https://github.com/lihop/setup-godot/compare/v2.1.5...v2.1.6) - 2025-09-01

### Fixed

- On Linux, check if the pulseaudio daemon is running before attempting to kill it. This prevents script failures in environments with 'set -e' and 'set -o pipefail' when the daemon is already stopped.

## [v2.1.5](https://github.com/lihop/setup-godot/compare/v2.1.4...v2.1.5) - 2025-08-02

### Fixed

- Fixed cache failure due to outdated @actions/cache package.

## [v2.1.4](https://github.com/lihop/setup-godot/compare/v2.1.3...v2.1.4) - 2025-01-08

### Changed

- All versions are now downloaded from the godotengine repo [releases](https://github.com/godotengine/godot/releases) rather than tuxfamily.org.

### Fixed

- Fixed error occuring on Windows runners due to mesa-dist-win release not being found (again).

## [v2.1.3](https://github.com/lihop/setup-godot/compare/v2.1.2...v2.1.3) - 2024-03-30

### Fixed

- Extract Godot 4 export templates to the correct location.

## [v2.1.2](https://github.com/lihop/setup-godot/compare/v2.1.1...v2.1.2) - 2024-02-11

### Changed

- Made changes to address several warnings, including use of deprecated node version and failure to reserve cache key.

### Fixed

- Fixed failure to install mono on Windows via Chocolatey package manager.
- Fixed silently failing Scream (virtual sound card) installation on Windows.

## [v2.1.1](https://github.com/lihop/setup-godot/compare/v2.1.0...v2.1.1) - 2023-12-29

### Added

- Added initial Linux non-mono support for Godot 4 (experimental).

### Changed

- Changed default Godot version from 3.5-stable to 3.5.1-stable.

### Fixed

- Fixed error occuring on Windows runners due to mesa-dist-win release not being found.

## [v2.1.0](https://github.com/lihop/setup-godot/compare/v2.0.1...v2.1.0) - 2023-01-10

### Added

- Added `github-token` input for use when downloading mesa-dist-win release from
  GitHub to avoid API rate limits. Defaults to ${{ secrets.GITHUB_TOKEN }} and
  shouldn't need to be set.
- Added caching of the mesa-dist-win download to further reduce API requests.

### Changed

- Change node version from 12 -> 16 and update packages.

### Fixed

- Fixed failure due to trying to kill pulseaudio daemon when it wasn't running.
- Fixed "Response code 403 (rate limit exceeded)" errors that were occuring on
  Windows runners due to hitting API rate limits.

## [v2.0.1](https://github.com/lihop/setup-godot/compare/v2.0.0...v2.0.1) - 2022-09-29

### Fixed

- Fixed segmentation fault when running Godot on Windows by pinning mesa-dist-win
  version to 22.1.7. A segmentation fault occurs when running Godot with the most
  recent version (22.2.0).

## [v2.0.0](https://github.com/lihop/setup-godot/compare/v1.0.2...v2.0.0) - 2022-08-26

### Changed

- Changed default Godot version to 3.5-stable.

### Security

- Updated node modules using `npm audit fix`.

## [v1.0.2](https://github.com/lihop/setup-godot/compare/v1.0.0...v1.0.2) - 2022-08-10

### Fixed

- Fixed "Unable to fetch some archives" error that would sometimes occur after running `apt-get install`
  by running `apt-get update` beforehand.

## [v1.0.1](https://github.com/lihop/setup-godot/compare/v1.0.0...v1.0.1) - 2022-07-13

### Fixed

- Fixed "command not found" error for `xset`.

## [v1.0.0](https://github.com/lihop/setup-godot/compare/v0.1.1...v1.0.0) - 2022-05-15

### Added

- [#6](https://github.com/lihop/setup-godot/issues/6): Added boolean `export-templates` input. If set to `true` export templates for the specified Godot version will be downloaded and cached in addition to the Godot executable.
- Start X11 server and dummy sound device on Linux runner. This means that executables requiring an X11 server (such as exported projects) will not need to be run with xvfb-run. The server will be started on $DISPLAY. If the DISPLAY environment variable is not set it will default to ':0' and DISPLAY will be set.
- This CHANGELOG file to keep a track of changes between releases.

### Changed

- Default Godot version from 3.4-stable -> 3.4.4-stable.
- Made package managers (i.e. APT, Chocolatey) less noisy.
- [#4](https://github.com/lihop/setup-godot/issues/4): Log a warning and keep going if cache save/restore failed.

### Fixed

- Handling of symlinks when `path` already exists. If `path` exists and is already a symlink to `target`, nothing needs to be done, otherwise `path` will be deleted, replaced with a symlink to `target`, and a warning logged.
- The `choco install mono` command occassionally times out, so retry it a few times.

### Security

- Updated node modules using `npm audit fix`.

## [v0.1.1](https://github.com/lihop/setup-godot/compare/v0.1.0...v0.1.1) - 2021-12-17

### Fixed

- Package installation for ubuntu-latest 32-bit.

## [v0.1.0](https://github.com/lihop/setup-godot/compare/v0.0.0...v0.1.0) - 2021-11-08

### Added

- [#1](https://github.com/lihop/setup-godot/issues/1): Support for the mono build.
- Caching support. Downloads will now be saved/restored to/from cache if possible. Can be disabled by setting `cache` input to false.

### Changed

- Default version is now 3.4-stable.
- Stable versions >= 3.4 are now downloaded from the godotengine repo [releases](https://github.com/godotengine/godot/releases) rather than tuxfamily.org.

## [v0.0.0](https://github.com/lihop/godot-setup/tags/v0.0.0) - 2021-07-24

### Added

- Initial release.
