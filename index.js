const core = require("@actions/core");
const exec = require("@actions/exec");
const github = require("@actions/github");

const Linux = require("./lib/Linux");
const MacOS = require("./lib/MacOS");
const Windows = require("./lib/Windows");

async function main() {
  try {
    let platform;

    core.debug(`process.platform: ${process.platform}`);
    switch (process.platform) {
      case "linux":
        core.info("🐧 Linux detected");
        platform = new Linux();
        break;
      case "win32":
        core.info("🪟 Windows detected");
        platform = new Windows();
        break;
      case "darwin":
        core.info("🍏 macOS detected");
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

    core.info("🏁 All done. Enjoy!");
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
