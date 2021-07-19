const Platform = require("./Platform");
const exec = require("@actions/exec");
const log = require("loglevel");

class Linux extends Platform {
  _getSuffix() {
    return this.mono ? `mono_x11_${this.bits}` : `x11.${this.bits}`;
  }
}

module.exports = Linux;
