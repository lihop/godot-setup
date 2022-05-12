# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/lihop/setup-godot/compare/v0.1.1...HEAD)

### Added

- This CHANGELOG file to keep a track of changes between releases.

## [0.1.1](https://github.com/lihop/setup-godot/compare/v0.1.0...v0.1.1) - 2021-12-17

### Fixed

- Package installation for ubuntu-latest 32-bit.

## [0.1.0](https://github.com/lihop/setup-godot/compare/v0.0.0...v0.1.0) - 2021-11-08

### Added

- [#1](https://github.com/lihop/setup-godot/issues/1): Support for the mono build.
- Caching support. Downloads will now be saved/restored to/from cache if possible. Can be disabled by setting `cache` input to false.

### Changed

- Default version is now 3.4-stable.
- Stable versions >= 3.4 are now downloaded from the godotengine repo [releases](https://github.com/godotengine/godot/releases) rather than tuxfamily.org.

## [0.0.0](https://github.com/lihop/godot-setup/tags/v0.0.0) - 2021-07-24

### Added

- Initial release.
