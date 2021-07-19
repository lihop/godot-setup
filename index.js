const core = require("@actions/core");
const exec = require("@actions/exec");
const github = require("@actions/github");
const log = require("loglevel");

const Linux = require("./lib/Linux");
const MacOS = require("./lib/MacOS");
const Windows = require("./lib/Windows");

async function main() {
  try {
    log.setLevel(core.getInput("log-level", { default: "info" }));

    let platform;

    log.debug(`process.platform: ${process.platform}`);
    switch (process.platform) {
      case "linux":
        log.info("🐧 Linux detected");
        platform = new Linux();
        break;
      case "win32":
        log.info("🪟 Windows detected");
        platform = new Windows();
        break;
      case "darwin":
        log.info("🍏 macOS detected");
        platform = new MacOS();
        break;
      default:
        core.setFailed(
          `⚠ Unrecognized platform: ${process.platform}. Aborting!`
        );
        return;
    }

    await platform.preDownload();
    await platform.download();
    await platform.postDownload();

    log.info("🏁 All done. Enjoy!");
  } catch (e) {
    core.setFailed(e);
  }
}

//async function runCommandWithXvfb(command, directory, options) {
//  await exec.exec("sudo apt-get install -y xvfb");
//  command = `xvfb-run --auto-servernum ${command}`;
//
//  try {
//    await runCommand(command);
//  } finally {
//    await cleanUpXvfb();
//  }
//}
//
//async function cleanUpXvfb() {
//  try {
//    await exec.exec("bash", [`${__dirname}/cleanup.sh`]);
//  } catch {}
//}

main();
