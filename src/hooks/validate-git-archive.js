#!/usr/bin/env node

const fs = require("fs");
const util = require("util");
const execAsync = util.promisify(require("child_process").exec);
const { dir: tmpDir } = require("tmp-promise");
const AdmZip = require("adm-zip");
const path = require("path");

function distinctPaths(items = []) {
  const distinctPaths = new Set();

  items.forEach((item) => {
    let parts = item.split(path.sep);
    for (let i = 1; i <= parts.length; i++) {
      const subPath = parts.slice(0, i).join(path.sep);
      distinctPaths.add(subPath);
    }
  });

  return Array.from(distinctPaths);
}

function hasExpectedItems(items, expectedItems) {
  const missingItems = [];

  expectedItems.forEach((item) => {
    if (!items.includes(item)) {
      console.log(`Missing item: ${item}`);
      missingItems.push(item);
    }
  });

  if (missingItems.length > 0) {
    throw new Error("Archive is missing items");
  }
}

function doesNotHaveUnexpectedItems(items, expectedItems) {
  const unexpectedItems = [];

  items.forEach((item) => {
    if (!expectedItems.find((expectedItem) => item.startsWith(expectedItem))) {
      console.log(`Unexpected item: ${item}`);
      unexpectedItems.push(item);
    }
  });

  if (unexpectedItems.length > 0) {
    throw new Error("Archive contains unexpected items");
  }
}

function validateArchive(archivePath, expectedItems) {
  // Enumerate distinct paths based on archive entries.
  const zip = new AdmZip(archivePath);
  const entryNames = zip.getEntries().map((entry) => entry.entryName);
  const items = distinctPaths(entryNames);

  // Check for existence of expected files/directories.
  hasExpectedItems(items, distinctPaths(expectedItems));

  // Check for absence of unexpected files/directories.
  doesNotHaveUnexpectedItems(items, distinctPaths(expectedItems));
}

async function createAndValidateGitArchive() {
  let tempDir;

  try {
    tempDir = await tmpDir({ unsafeCleanup: true });

    const archivePath = `${tempDir.path}/archive.zip`;
    await execAsync(`git archive -o "${archivePath}" HEAD`, {
      cwd: process.cwd(),
    });

    const expectedItems = process.argv.slice(2);
    await validateArchive(archivePath, expectedItems);
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    if (tempDir) {
      await tempDir.cleanup();
    }
  }
}

if (require.main === module) {
  createAndValidateGitArchive().catch(() => {
    process.exit(1);
  });
}

module.exports = { validateArchive };
