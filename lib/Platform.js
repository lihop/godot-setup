const cache = require("@actions/cache");
const core = require("@actions/core");
const exec = require("@actions/exec");
const tc = require("@actions/tool-cache");
const fs = require("fs").promises;
const github = require("@actions/github");
const path = require("path");
const semver = require("semver");
const wget = require("wget-improved");

const DEFAULT_ALIAS = "godot";
const DEFAULT_BITS = 64;
const DEFAULT_VERSION = "3.5-stable";

class Platform {
  version;
  bits;
  mono;
  alias;
  release;
  subdir;
  suffix;
  downloadUrl;
  exportTemplatesUrl;
  installDir;

  constructor() {
    this.alias = core.getInput("alias", { default: DEFAULT_ALIAS });
    this.bits = core.getInput("bits", { default: DEFAULT_BITS });
    this.mono =
      core.getInput("mono") === "true" || core.getInput("mono") === "True";
    this.cache =
      core.getInput("cache") === "true" || core.getInput("cache") === "True";
    this.exportTemplates =
      core.getInput("export-templates", { default: "true" }) == "true" ||
      core.getInput("export_templates") === "True";

    // These inputs are not officially documented/supported.
    this.downloadUrl = core.getInput("download-url", { default: null });
    this.exportTemplatesUrl = core.getInput("export-templates-url", {
      default: null,
    });

    // Version
    const rawVersion = core.getInput("version", { default: DEFAULT_VERSION });
    core.debug("Raw version:", rawVersion);
    const re = new RegExp(/v?(?<version>\d+\.\d+(\.\d+)?)(-(?<release>.*)?)?$/);
    const result = re.exec(rawVersion);
    core.debug("Regex result:", result);
    if (!result || !result.groups || !result.groups.version)
      throw new Error("Failed to detect version");
    this.version = result.groups.version;
    this.release = result.groups.release || "stable";

    core.info(
      `Detected version: v${this.version}-${this.release} ${this.bits}bit ${
        this.mono ? "Mono" : ""
      }`
    );

    this.installDir = `${process.cwd()}/v${this.version}-${this.release}`;
  }

  getDownloadUrl(filename) {
    // As of 3.4-stable, stable releases are now mirrored on the godotengine github repo.
    const version = semver.coerce(`${this.version}-${this.release}`);

    let subdir = this.release === "stable" ? "" : `/${this.release}`;
    if (this.mono) subdir += "/mono";

    if (this.release === "stable" && semver.gte(version, "3.4.0-stable")) {
      return `https://github.com/godotengine/godot/releases/download/${this.version}-stable/${filename}`;
    } else {
      return `https://downloads.tuxfamily.org/godotengine/${this.version}${subdir}/${filename}`;
    }
  }

  async preDownload() {
    core.info(`📁 Creating install directory at ${this.installDir}`);
    await fs.mkdir(this.installDir, { recursive: true });
    core.debug("Install directory created");

    if (!this.downloadUrl) {
      core.debug("Custom download url not set");
      const filename = `Godot_v${this.version}-${
        this.release
      }_${this._getSuffix()}.zip`;
      this.downloadUrl = this.getDownloadUrl(filename);
    }

    if (this.exportTemplates && !this.exportTemplatesUrl) {
      core.debug("Custom export templates url not set");
      const filename = `Godot_v${this.version}-${this.release}_${
        this.mono ? "mono_" : ""
      }export_templates.tpz`;
      this.exportTemplatesUrl = this.getDownloadUrl(filename);
    }
  }

  async download() {
    let needsCache = false;

    if (this.cache) {
      core.info(
        `Trying to restore Godot download ${
          this.exportTemplates ? "and export templates " : ""
        }from cache...`
      );
      try {
        await cache.restoreCache(
          [this.installDir],
          this.downloadUrl + this.exportTemplatesUrl
        );
      } catch (error) {
        core.warning(`Failed to restore cache: '${error.message}'. Skipping!`);
      }
    }

    if (this.exportTemplates) {
      const filename = path.basename(this.exportTemplatesUrl);
      const dest = `${this.installDir}/${filename}`;

      try {
        await fs.access(dest);
        core.info(
          `Export templates already downloaded from ${this.exportTemplatesUrl}`
        );
      } catch (_e) {
        core.info(
          `Downloading export templates from ${this.exportTemplatesUrl}`
        );
        await tc.downloadTool(this.exportTemplatesUrl, dest);
        needsCache = this.cache;
      }
    }

    {
      const filename = path.basename(this.downloadUrl);
      const dest = `${this.installDir}/${filename}`;

      try {
        await fs.access(dest);
        core.info(`Godot already downloaded from ${this.downloadUrl}`);
      } catch (_e) {
        core.info(`Downloading Godot from ${this.downloadUrl}`);
        await tc.downloadTool(this.downloadUrl, dest);
        needsCache = this.cache;
      }
    }

    if (needsCache) {
      core.info(
        `Caching Godot download${
          this.exportTemplates ? " and export templates" : ""
        }...`
      );
      try {
        await cache.saveCache(
          [this.installDir],
          this.downloadUrl + this.exportTemplatesUrl
        );
        core.info(
          `Godot download ${
            this.exportTemplates ? "and export templates " : ""
          }cached.`
        );
      } catch (error) {
        core.warning(`Failed to cache download: '${error.message}.`);
      }
    }
  }

  async postDownload() {
    // Extract Godot archive.
    const filename = path.basename(this.downloadUrl);
    console.debug("🗜 Extracting Godot archive");
    await tc.extractZip(`${this.installDir}/${filename}`, this.installDir);
    console.debug(`Godot archive extracted to ${this.installDir}`);

    if (this.exportTemplates) {
      // Extract export templates archive.
      await fs.mkdir(this._getExportTemplatesDir(), { recursive: true });
      const filename = path.basename(this.exportTemplatesUrl);
      const dest = `${this._getExportTemplatesDir()}/${this.version}.${
        this.release
      }${this.mono ? ".mono" : ""}`;
      console.debug("🗜 Extracting export templates");
      await tc.extractZip(`${this.installDir}/${filename}`, path.dirname(dest));
      await fs.rename(`${path.dirname(dest)}/templates`, dest);
      console.debug(`Export templates extracted to ${dest}`);
    }

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
    await this._symlink(target, ppath);
    if (this.mono) {
      // Also Symlink GodotSharp directory if mono build.
      await this._symlink(
        `${path.dirname(target)}/GodotSharp`,
        `${path.dirname(ppath)}/GodotSharp`
      );
    }
    console.debug(`Symbolic link created!`);
  }

  async runCommand() {}

  async _symlink(target, path) {
    // Check if path exists.
    try {
      await fs.access(path);
      // path exists, check if it is a symlink to target.
      try {
        const linkString = await fs.readlink();
        if (target === linkString) {
          // path is already a symlink to target. Nothing to do.
          core.info(`'${path}' is already a symbolic link to '${target}'.`);
          return;
        } else {
          throw new Error(`'${path}' is not a symbolic link to '${target}'.`);
        }
      } catch (_e) {
        try {
          // path is not a symlink to target. Delete path, log a warning, and create the symlink.
          await fs.unlink(path);
          await _makeSymlink(target, path);
          core.warning(
            `'${path}' already existed! It was deleted and replaced with a symlink to '${target}'.`
          );
        } catch (error) {
          throw error;
        }
      }
    } catch (_e) {
      // path does not exists so create the symlink.
      await fs.symlink(target, path);
    }
  }

  _parseVersion() {
    core.debug(`Version major: ${semver.major(version)}`);
    core.debug(`Version minor: ${semver.minor(version)}`);
    core.debug(`Version patch: ${semver.patch(version)}`);
    core.debug(semver.prerelease(version));

    if (!semver.valid(semver.coerce(version))) {
      throw new Error("Invalid version");
    }
  }

  _getSuffix() {
    throw new Error("Not implemented");
  }

  _getExportTemplatesDir() {
    throw new Error("Not implemented");
  }

  async _getSymlinkTarget() {
    const filename = path.basename(this.downloadUrl, ".zip");
    return `${this.installDir}/${filename}`;
  }
}

module.exports = Platform;
