const Platform = require("./Platform");
const cache = require("@actions/cache");
const core = require("@actions/core");
const exec = require("@actions/exec");
const tc = require("@actions/tool-cache");
const fs = require("fs").promises;
const glob = require("glob");
const path = require("path");
const retry = require("async-retry");

const MESA_DIST_WIN_VERSION = "25.1.6";
const MONO_VERSION = "6.12.0.182";

class Windows extends Platform {
  async preDownload() {
    await super.preDownload();
  }

  async postDownload() {
    await super.postDownload();

    let mesaRestoredFromCache = false;

    // Download mesa-dist-win.
    const outputdir = `${this.installDir}/mesa-dist-win`;
    core.info("Downloading mesa-dist-win...");
    const user = "pal1000";
    const repo = "mesa-dist-win";
    const disableLogging = !core.isDebug();
    const filterRelease = (release) => !release.prerelease;
    const filterAsset = (asset) =>
      asset.name.includes(`${MESA_DIST_WIN_VERSION}-release-msvc`);
    await new Promise((resolve, reject) => {
      // Use GitHub token to avoid API rate limits on download.
      // Needs to be set before requiring fetch-github-release.
      process.env.GITHUB_TOKEN = core.getInput("github-token");
      const { downloadRelease } = require("@terascope/fetch-github-release");
      downloadRelease(
        user,
        repo,
        outputdir,
        filterRelease,
        filterAsset,
        false,
        disableLogging,
      )
        .then(() => resolve())
        .catch((err) => reject(err))
        .finally(() => (process.env.GITHUB_TOKEN = ""));
    });
    core.info("mesa-dist-win downloaded!");

    // Extract mesa-dist-win.
    core.info("Extracting mesa-dist-win...");
    await Promise.all(
      glob
        .sync(`${this.installDir}/mesa-dist-win/*.7z`)
        .map((file) => tc.extract7z(file, `${this.installDir}/mesa-dist-win`)),
    ).catch(console.error);
    core.info("mesa-dist-win extracted!");

    // Symlink to mesa-dist-win libraries.
    core.info(`🔗 Creating symbolic links to mesa-dist-win libraries...`);
    const targetDir = `${this.installDir}/mesa-dist-win/${
      this.bits == 64 ? "x64" : "x86"
    }/`;
    core.debug(`Linking files in '${targetDir}'`);
    const dllFiles = glob.sync(`${targetDir}/*.dll`);
    core.debug("Found the following '.dll' files to link: ", dllFiles);
    await Promise.all(
      dllFiles.map(async (file) => {
        const ppath = `${this.installDir}/bin/${path.basename(file)}`;
        core.debug(`Linking '${file}' to '${ppath}'...`);
        await this._symlink(file, ppath);
      }),
    );
    core.info(`Symbolic links to mesa-dist-win libraries created!`);

    // Install Scream, a virtual sound card.
    core.info(
      "Installing Scream, a virtual sound card (https://github.com/duncanthrax/scream)",
    );
    try {
      await exec.exec("powershell.exe", [
        `${__dirname}/../scripts/install_scream.ps1`,
      ]);
      core.info("Virtual sound card installed.");
    } catch (error) {
      core.error(`Failed to install virtual sound card: ${error.message}`);
    }

    if (this.mono) {
      // Install Mono.
      core.info("Installing Mono...");
      // Occasionally choco install fails with a timeout, so retry a few times.
      await retry(
        async () =>
          await exec.exec(
            `choco install --no-progress mono --version=${MONO_VERSION}`,
          ),
        {
          retries: 5,
        },
      );
      core.info("Mono installed.");
    }
  }

  _getSuffix() {
    return this.mono ? `mono_win${this.bits}` : `win${this.bits}.exe`;
  }

  _getExportTemplatesDir() {
    return `${process.env.APPDATA}/Godot/${this.exportTemplatesFolderName}`;
  }

  async _getSymlinkTarget() {
    if (!this.mono) return await super._getSymlinkTarget();
    const filename = path.basename(this.downloadUrl, ".zip");
    return `${await super._getSymlinkTarget()}/${filename}.exe`;
  }
}

module.exports = Windows;
