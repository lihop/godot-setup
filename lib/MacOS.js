const Platform = require("./Platform");
const core = require("@actions/core");
const fs = require("fs").promises;
const path = require("path");
const semver = require("semver");

class MacOS extends Platform {
  constructor() {
    super();
    if (this.bits !== "64")
      throw new Error("Only 64-bit is supported for macOS");
  }

  _getSuffix() {
    let suffix = this.mono ? "mono_" : "";
    const version = semver.coerce(`${this.version}-${this.release}`);

    if (semver.gte(version, "4.0.0-beta1")) {
      suffix += "macos.universal";
    } else if (
      (this.mono && semver.gte(version, "3.4.0-beta1")) ||
      (!this.mono && semver.gte(version, "3.2.4-beta1"))
    ) {
      suffix += "osx.universal";
    } else if (semver.gt(version, "3.0.6")) {
      suffix += "osx.64";
    } else {
      suffix += this.mono ? "osx64" : "osx.fat";
    }

    return suffix;
  }

  _getExportTemplatesDir() {
    return process.env.HOME + "/Library/Application Support/Godot/templates";
  }

  async _getSymlinkTarget() {
    const appDir = !this.mono ? "Godot.app" : "Godot_mono.app";
    return `${this.installDir}/${appDir}/Contents/MacOS/Godot`;
  }
}

module.exports = MacOS;
