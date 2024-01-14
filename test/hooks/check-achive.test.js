const path = require("path");
const { validateArchive } = require("../../src/hooks/validate-git-archive");

// Path from the git repository root.
const rootPath = path.join("test", "hooks", "fixtures");

describe("validateArchive", () => {
  describe("empty archive", () => {
    const archivePath = path.join(rootPath, "empty.zip");

    describe("when no items expected", () => {
      const expectedItems = [];
      test("is valid", () => {
        expect(() => validateArchive(archivePath, expectedItems)).not.toThrow();
      });
    });

    describe("when items expected", () => {
      test.each([
        [["file.txt"]],
        [["file1.txt, file2.txt"]],
        [["addons/plugin"]],
        [["addons/plugin1", "addons/plugin2", "file.txt"]],
      ])("is invalid", (expectedItems) => {
        expect(() => validateArchive(archivePath, expectedItems)).toThrow();
      });
    });
  });

  describe("simple archive", () => {
    const archivePath = path.join(rootPath, "simple.zip");

    describe("when present directory expected", () => {
      const expectedItems = ["addons/plugin"];
      test("is valid", () => {
        expect(() => validateArchive(archivePath, expectedItems)).not.toThrow();
      });
    });

    describe("when present file expected", () => {
      const expectedItems = ["addons/plugin/file.txt"];
      test("is valid", () => {
        expect(() => validateArchive(archivePath, expectedItems)).not.toThrow();
      });
    });

    describe("when missing directory expected", () => {
      const expectedItems = ["addons/plugin", "addons/plugin2"];
      test("is invalid", () => {
        expect(() => validateArchive(archivePath, expectedItems)).toThrow();
      });
    });

    describe("when missing file expected", () => {
      const expectedItems = ["addons/plugin/no-such-file.txt"];
      test("is invalid", () => {
        expect(() => validateArchive(archivePath, expectedItems)).toThrow();
      });
    });

    describe("when nothing expected", () => {
      const expectedItems = [];
      test("is invalid", () => {
        expect(() => validateArchive(archivePath, expectedItems)).toThrow();
      });
    });

    describe("when directory expected without full path", () => {
      const expectedItems = ["plugin"];
      test("is invalid", () => {
        expect(() => validateArchive(archivePath, expectedItems)).toThrow();
      });
    });

    describe("when file expected without full path", () => {
      const expectedItems = ["file.txt"];
      test("is invalid", () => {
        expect(() => validateArchive(archivePath, expectedItems)).toThrow();
      });
    });
  });

  describe("complex archive", () => {
    const archivePath = path.join(rootPath, "complex.zip");

    describe("when present directories and files are expected", () => {
      const expectedItems = ["addons", "assets", "file1.txt", "file2.txt"];
      test("is valid", () => {
        expect(() => validateArchive(archivePath, expectedItems)).not.toThrow();
      });
    });

    describe("when present sub-directories and files are expected", () => {
      const expectedItems = [
        "addons/plugin",
        "addons/plugin2",
        "assets",
        "file1.txt",
        "file2.txt",
      ];
      test("is valid", () => {
        expect(() => validateArchive(archivePath, expectedItems)).not.toThrow();
      });
    });

    describe("when present files are expected", () => {
      const expectedItems = [
        "addons/plugin/file.txt",
        "addons/plugin2/file1.txt",
        "addons/plugin2/file2.txt",
        "assets/asset1.txt",
        "file1.txt",
        "file2.txt",
      ];
      test("is valid", () => {
        expect(() => validateArchive(archivePath, expectedItems)).not.toThrow();
      });
    });
  });
});
