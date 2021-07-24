const _7z = require("7zip-min");
const core = require("@actions/core");
const exec = require("@actions/exec");
const fs = require("fs").promises;
const github = require("@actions/github");
const log = require("loglevel");
const path = require("path");
const semver = require("semver");
const wget = require("wget-improved");

const DEFAULT_ALIAS = "godot";
const DEFAULT_BITS = 64;
const DEFAULT_MONO = false;
const DEFAULT_VERSION = "3.3.2-stable";

class Platform {
  version;
  bits;
  mono;
  alias;
  release;
  subdir;
  suffix;
  downloadUrl;
  installDir;

  constructor() {
    this.alias = core.getInput("alias", { default: DEFAULT_ALIAS });
    this.bits = core.getInput("bits", { default: DEFAULT_BITS });
    this.downloadUrl = core.getInput("download-url", { default: null });

    // Version
    const rawVersion = core.getInput("version", { default: DEFAULT_VERSION });
    log.debug("Raw version:", rawVersion);
    const re = new RegExp(/v?(?<version>\d+\.\d+(\.\d+)?)(-(?<release>.*)?)?$/);
    const result = re.exec(rawVersion);
    log.trace("Regex result:", result);
    if (!result || !result.groups || !result.groups.version)
      throw new Error("Failed to detect version");
    this.version = result.groups.version;
    this.release = result.groups.release || "stable";

    log.info(
      `Detected version: v${this.version}-${this.release} ${this.bits}bit ${
        this.mono ? "Mono" : ""
      }`
    );

    this.installDir = `${process.cwd()}/v${this.version}-${this.release}`;
  }

  async preDownload() {
    log.info(`📁 Creating install directory at ${this.installDir}`);
    await fs.mkdir(this.installDir, { recursive: true });
    log.debug("Install directory created");

    if (!this.downloadUrl) {
      log.debug("Custom download url not set");

      let subdir = this.release === "stable" ? "" : `/${this.release}`;
      if (this.mono) subdir += "/mono";

      const filename = `Godot_v${this.version}-${
        this.release
      }_${this._getSuffix()}.zip`;
      this.downloadUrl = `https://downloads.tuxfamily.org/godotengine/${this.version}${subdir}/${filename}`;
    }
  }

  async download() {
    const filename = path.basename(this.downloadUrl);
    log.info(`Downloading Godot from ${this.downloadUrl}`);
    await exec.exec(
      `curl -o ${this.installDir}/${filename} ${this.downloadUrl}`
    );
  }

  async postDownload() {
    // Extract archive.
    const filename = path.basename(this.downloadUrl);
    console.debug("🗜 Extracting Godot archive");
    await new Promise((resolve) =>
      _7z.unpack(`${this.installDir}/${filename}`, this.installDir, () =>
        resolve()
      )
    );
    console.debug(`Godot archive extracted to ${this.installDir}`);
    await exec.exec("ls -lR " + this.installDir);

    // Create bin directory and add to PATH.
    console.debug(
      `📁 Creating directory for binary at '${this.installDir}/bin'...`
    );
    await fs.mkdir(`${this.installDir}/bin`, { recursive: true });
    console.debug(`Directory '${this.installDir}/bin' created!`);
    console.debug(
      `Adding binary directory '${this.installDir}/bin' to GITHUB_PATH...`
    );
    core.addPath(`${this.installDir}/bin`);
    console.info(
      `Binary directory '${this.installDir}/bin' added to GITHUB_PATH!`
    );

    // Symlink Godot executable to bin directory.
    const target = await this._getSymlinkTarget();
    const ppath = `${this.installDir}/bin/${this.alias}`;
    console.debug(
      `🔗 Creating symbolic link from '${target}' to '${ppath}'...`
    );
    await fs.symlink(target, ppath);
    console.debug(`Symbolic link created!`);
  }

  async runCommand() {}

  _parseVersion() {
    log.debug(`Version major: ${semver.major(version)}`);
    log.debug(`Version minor: ${semver.minor(version)}`);
    log.debug(`Version patch: ${semver.patch(version)}`);
    log.debug(semver.prerelease(version));

    if (!semver.valid(semver.coerce(version))) {
      throw new Error("Invalid version");
    }
  }

  _getSuffix() {
    throw new Error("Not implemented");
  }

  async _getSymlinkTarget() {
    const filename = path.basename(this.downloadUrl, ".zip");
    return `${this.installDir}/${filename}`;
  }
}

module.exports = Platform;
