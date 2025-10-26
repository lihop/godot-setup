const Platform = require("./Platform");
const core = require("@actions/core");
const fs = require("fs").promises;
const path = require("path");
const semver = require("semver");

class MacOS extends Platform {
  _getArch() {
    const arch = super._getArch();

    if (!["x86_64", "arm64", "universal"].includes(arch)) {
      throw new Error(`Architecture '${arch}' is not supported on macOS`);
    }

    return "universal";
  }

  _getRunnerArchCompatibilityMap() {
    return new Map([
      ["x86_64", ["x86_64", "universal"]],
      ["arm64", ["arm64", "universal"]],
    ]);
  }

  _getSuffix() {
    return this.mono ? "mono_macos.universal" : "macos.universal";
  }

  _getExportTemplatesDir() {
    return `${process.env.HOME}/Library/Application Support/Godot/export_templates`;
  }

  async _getSymlinkTarget() {
    const appDir = !this.mono ? "Godot.app" : "Godot_mono.app";
    return `${this.installDir}/${appDir}/Contents/MacOS/Godot`;
  }
}

module.exports = MacOS;
