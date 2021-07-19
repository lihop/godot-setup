const Platform = require("./Platform");
const _7z = require("7zip-min");
const downloadRelease = require("@terascope/fetch-github-release");
const exec = require("@actions/exec");
const fs = require("fs").promises;
const glob = require("glob");
const log = require("loglevel");
const path = require("path");

class Windows extends Platform {
  async preDownload() {
    await super.preDownload();
  }

  async postDownload() {
    await super.postDownload();

    // Download mesa-dist-win.
    console.log("Downloading mesa-dist-win...");
    const user = "pal1000";
    const repo = "mesa-dist-win";
    const outputdir = `${this.installDir}/mesa-dist-win`;
    const disableLogging = log.getLevel() >= log.levels.INFO;
    const filterRelease = (release) => !release.prerelease;
    const filterAsset = (asset) => asset.name.includes("release-msvc");
    await new Promise((resolve, reject) =>
      downloadRelease(
        user,
        repo,
        outputdir,
        filterRelease,
        filterAsset,
        false,
        disableLogging
      )
        .then(() => resolve())
        .catch((err) => reject(err))
    );
    console.log("mesa-dist-win downloaded!");

    // Extract mesa-dist-win.
    console.log("Extracting mesa-dist-win...");
    console.log("🗜 Extracting mesa-dist-win");
    await new Promise((resolve) =>
      _7z.unpack(
        `${this.installDir}/mesa-dist-win/*.7z`,
        `${this.installDir}/mesa-dist-win`,
        () => resolve()
      )
    );
    console.log("mesa-dist-win extracted!");

    // Symlink to mesa-dist-win libraries.
    log.info(`🔗 Creating symbolic links to mesa-dist-win libraries...`);
    const targetDir = `${this.installDir}/mesa-dist-win/${
      this.bits == 64 ? "x64" : "x86"
    }/`;
    log.debug(`Linking files in '${targetDir}'`);
    const files = glob.sync(`${targetDir}/*.dll`);
    log.trace("Found the following '.dll' files to link: ", files);
    log.trace("Linking them...");
    await Promise.all(
      files.map(async (file) => {
        const ppath = `${this.installDir}/bin/${path.basename(file)}`;
        console.debug(`Linking '${file}' to '${ppath}'...`);
        await fs.link(file, ppath);
      })
    );
    log.info(`Symbolic links to mesa-dist-win libraries created!`);

    // Install Scream, a virtual sound card.
    log.info(
      "Installing Scream, a virtual sound card (https://github.com/duncanthrax/scream)"
    );
    await exec.exec("powershell.exe", ["./scripts/install_scream.ps1"]);
    log.info("Virtual sound card installed.");
    //
  }

  _getSuffix() {
    return this.mono ? `mono_win${this.bits}.exe` : `win${this.bits}.exe`;
  }
}

module.exports = Windows;
