const Platform = require("./Platform");
const core = require("@actions/core");
const exec = require("@actions/exec");
const path = require("path");
const replace = require("replace-in-file");
const retry = require("async-retry");
const semver = require("semver");

class Linux extends Platform {
  async preDownload() {
    await super.preDownload();

    core.info(`Installing Linux ${this.bits}bit dependencies...`);
    if (this.bits == 64) {
      await exec.exec("sudo apt-get update -o=Dpkg::Use-Pty=0 -yqq");
      await exec.exec(
        "sudo DEBIAN_FRONTEND='noninteractive' apt-get install -o=Dpkg::Use-Pty=0 -yqq pulseaudio xvfb x11-xserver-utils mesa-vulkan-drivers",
      );
    } else {
      await exec.exec("sudo dpkg --add-architecture i386");
      await exec.exec("sudo apt-get update -o=Dpkg::Use-Pty=0 -yqq");
      await exec.exec(
        "sudo DEBIAN_FRONTEND='noninteractive' apt-get install -o=Dpkg::Use-Pty=0 -yqq pulseaudio xvfb x11-xserver-utils libasound2:i386 libpulse0:i386 libxcursor-dev:i386 libxinerama-dev:i386 libxrandr-dev:i386 libxi-dev:i386 libgl-dev:i386 libudev-dev:i386 mesa-vulkan-drivers:i386",
      );
    }
    core.info(`Linux ${this.bits}bit dependencies installed!`);

    try {
      await exec.exec("xset -q");
      core.info("X11 server already running on display " + process.env.DISPLAY);
    } catch (_e) {
      // Start X11 server.
      let display = ":0";
      if (process.env.DISPLAY) {
        display = process.env.DISPLAY;
        core.info(`DISPLAY environment variable is set to '${display}'.`);
      } else {
        core.info(
          `DISPLAY environment variable not set. Setting 'DISPLAY=${display}'.`,
        );
        core.exportVariable("DISPLAY", display);
      }
      core.info(`Starting X11 server on ${display}...`);
      await exec.exec(
        // Run command with '/bin/bash -c' to support redirection ('>').
        `/bin/bash -c "sudo Xvfb -ac ${display} -screen 0 1920x1080x24 > /dev/null 2>&1 &"`,
      );
      // Check that X11 server is running.
      // Retry a few times in case the X11 server was slow to start.
      await retry(
        async () => await exec.exec('/bin/bash -c "xset -q > /dev/null 2>&1"'),
        {
          retries: 5,
        },
      );
      core.info("X11 server is running.");
    }

    // Start dummy sound device.
    core.info("Starting dummy sound device...");
    try {
      await exec.exec("pulseaudio --check");
    } catch (_e) {
      await exec.exec("pulseaudio -D");
    }
    await exec.exec("pulseaudio --check"); // Check that dummy sound device is running.
    core.info("Dummy sound device started.");
  }

  _getSuffix() {
    let suffix = this.mono ? "mono_" : "";
    const version = semver.coerce(`${this.version}-${this.release}`);

    if (semver.gte(version, "4.0.0-beta1")) {
      suffix += `linux${this.mono ? "_" : "."}x86_${this.bits}`;
    } else if (semver.gte(version, "4.0.0")) {
      suffix += `linux.${this.bits}`;
    } else {
      suffix += this.mono ? `x11_${this.bits}` : `x11.${this.bits}`;
    }

    return suffix;
  }

  _getExportTemplatesDir() {
    return `${process.env.HOME}/.local/share/godot/${this.exportTemplatesFolderName}`;
  }

  async _getSymlinkTarget() {
    let wrapped = await super._getSymlinkTarget();
    const version = semver.coerce(`${this.version}-${this.release}`);

    if (this.mono) {
      const filename = path.basename(this.downloadUrl, `_${this.bits}.zip`);
      if (semver.gte(version, "4.0.0-beta1")) {
        wrapped += `/${filename}_${this.bits}`;
      } else {
        wrapped += `/${filename}.${this.bits}`;
      }
    }
    const wrapper = `${wrapped}-wrapper`;
    await exec.exec("cp", [
      `${__dirname}/../scripts/godot_x11_wrapper.sh`,
      wrapper,
    ]);
    await replace({ files: wrapper, from: /GODOT_EXECUTABLE/g, to: wrapped });
    return wrapper;
  }
}

module.exports = Linux;
