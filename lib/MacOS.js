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
    const version = semver.coerce(`${this.version}-${this.release}`);

    if (!this.mono) {
      if (semver.lt(version, "3.2.4-beta1")) return "osx.64";
      else return "osx.universal";
    } else {
      if (semver.lt(version, "3.4.0-beta1")) return "mono_osx.64";
      else return "mono_osx.universal";
    }
  }

  async _getSymlinkTarget() {
    const appDir = !this.mono ? "Godot.app" : "Godot_mono.app";
    return `${this.installDir}/${appDir}/Contents/MacOS/Godot`;
  }
}

module.exports = MacOS;
