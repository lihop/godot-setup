const Platform = require("./Platform");
const exec = require("@actions/exec");
const log = require("loglevel");
const replace = require("replace-in-file");

class Linux extends Platform {
  async preDownload() {
    await super.preDownload();

    await exec.exec(
      "sudo DEBIAN_FRONTEND='noninteractive' apt-get install -y pulseaudio xvfb"
    );
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
