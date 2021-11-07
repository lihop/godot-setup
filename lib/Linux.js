const Platform = require("./Platform");
const core = require("@actions/core");
const exec = require("@actions/exec");
const replace = require("replace-in-file");

class Linux extends Platform {
  async preDownload() {
    await super.preDownload();

    core.info(`Installing Linux ${this.bits}bit dependencies...`);
    if (this.bits == 64) {
      if (process.env.GITHUB_ACTOR == "nektos/act") {
        await exec.exec("sudo apt-get update -y");
      }
      await exec.exec(
        "sudo DEBIAN_FRONTEND='noninteractive' apt-get install -y pulseaudio xvfb"
      );
    } else {
      await exec.exec("sudo dpkg --add-architecture i386");
      await exec.exec("sudo apt-get update -y");
      await exec.exec(
        "sudo DEBIAN_FRONTEND='noninteractive' apt-get install -y pulseaudio:i386 xvfb libxcursor-dev:i386 libxinerama-dev:i386 libxrandr-dev:i386 libxi-dev:i386 libgl-dev:i386 libudev-dev:i386"
      );
    }
    core.info(`Linux ${this.bits}bit dependencies installed!`);
  }

  _getSuffix() {
    return this.mono ? `mono_x11_${this.bits}` : `x11.${this.bits}`;
  }

  async _getSymlinkTarget() {
    const wrapped = await super._getSymlinkTarget();
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
