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

    core.info(`Installing Linux ${this.arch} dependencies...`);

    await exec.exec("sudo apt-get update -o=Dpkg::Use-Pty=0 -yqq");
    await exec.exec(
      "sudo DEBIAN_FRONTEND='noninteractive' apt-get install -o=Dpkg::Use-Pty=0 -yqq pulseaudio xvfb x11-xserver-utils mesa-vulkan-drivers",
    );

    if (this.arch === "x86_32") {
      await exec.exec("sudo dpkg --add-architecture i386");
      await exec.exec("sudo apt-get update -o=Dpkg::Use-Pty=0 -yqq");

      let packages =
        "pulseaudio xvfb x11-xserver-utils libasound2:i386 libpulse0:i386 libxcursor1:i386 libxinerama1:i386 libxrandr2:i386 libxi6:i386 libgl1:i386 libgles2:i386 libegl1:i386 libvulkan1:i386 libudev1:i386 libgbm1:i386 mesa-vulkan-drivers:i386";

      if (this.mono) {
        // Add 32-bit .NET runtime and fontconfig for mono builds
        packages += " libfontconfig1:i386";
        // Install .NET 8.0 runtime for 32-bit (required for Godot mono)
        await exec.exec(
          "wget -q https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb",
        );
        await exec.exec("sudo dpkg -i packages-microsoft-prod.deb");
        await exec.exec("sudo apt-get update -o=Dpkg::Use-Pty=0 -yqq");
        packages += " dotnet-runtime-8.0";
      }

      await exec.exec(
        `sudo DEBIAN_FRONTEND='noninteractive' apt-get install -o=Dpkg::Use-Pty=0 -yqq ${packages}`,
      );
    } else if (this.arch === "arm32") {
      core.info("Configuring multiarch support for armhf on arm64...");

      await exec.exec("sudo dpkg --add-architecture armhf");
      await exec.exec("sudo apt-get update -o=Dpkg::Use-Pty=0 -yqq");

      await exec.exec(
        "sudo DEBIAN_FRONTEND='noninteractive' apt-get install -o=Dpkg::Use-Pty=0 -yqq --no-install-recommends " +
          "libasound2:armhf libpulse0:armhf libxcursor1:armhf libxinerama1:armhf libxrandr2:armhf libxi6:armhf " +
          "libgl1:armhf libgles2:armhf libegl1:armhf libudev1:armhf libgbm1:armhf " +
          "libgcc-s1:armhf libstdc++6:armhf libvulkan1:armhf libfontconfig1:armhf libxkbcommon0:armhf",
      );
    }
    core.info(`Linux ${this.arch} dependencies installed!`);

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

    if (this.arch === "arm32") {
      // ARM32 emulation can have issues with PulseAudio, disable audio entirely
      core.info("Disabling audio for ARM32 to prevent hanging...");
      core.exportVariable("GODOT_AUDIO_DRIVER", "Dummy");
      core.exportVariable("PULSE_RUNTIME_PATH", "/dev/null");
      core.exportVariable("PULSE_SERVER", "");
      core.exportVariable("ALSA_PCM_CARD", "null");
      core.exportVariable("ALSA_PCM_DEVICE", "0");
      core.exportVariable("SDL_AUDIODRIVER", "dummy");
      core.exportVariable("DISPLAY", ":0");
      core.info("Audio and display configured for ARM32.");
    } else {
      try {
        await exec.exec("pulseaudio --check");
      } catch (_e) {
        try {
          await exec.exec("pulseaudio -D");
          await exec.exec("pulseaudio --check"); // Check that dummy sound device is running.
          core.info("Dummy sound device started.");
        } catch (_e2) {
          core.warning(
            "Pulseaudio not available, continuing without sound device.",
          );
        }
      }
    }
  }

  _getArch() {
    const arch = super._getArch();
    const version = semver.coerce(`${this.version}-${this.release}`);

    if (semver.lt(version, "4.2.0") && ["arm64", "arm32"].includes(arch)) {
      throw new Error(
        `Architecture '${arch}' is not supported for versions less than 4.2-stable`,
      );
    }

    if (!["x86_64", "x86_32", "arm64", "arm32"].includes(arch)) {
      throw new Error(`Architecture '${arch}' is not supported on Linux`);
    }

    return arch;
  }

  _getSuffix() {
    if (this.mono) {
      return `mono_linux_${this.arch}`;
    } else {
      return `linux.${this.arch}`;
    }
  }

  _getExportTemplatesDir() {
    return `${process.env.HOME}/.local/share/godot/export_templates`;
  }

  async _getSymlinkTarget() {
    let wrapped = await super._getSymlinkTarget();

    if (this.mono) {
      const filename = path.basename(this.downloadUrl, ".zip");
      const archToken = `_${this.arch}`;
      const binaryName = filename.endsWith(archToken)
        ? filename.replace(archToken, `.${this.arch}`)
        : filename;
      wrapped = `${wrapped}/${binaryName}`;
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
