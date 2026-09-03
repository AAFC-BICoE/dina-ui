/**
 * Tests the run-level "test report" composer (jest-ci-compose-report.js) on every run.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  composeReport,
  readStatsDir,
  formatDuration
} = require("../jest-ci-compose-report");

function chunkStats(overrides = {}) {
  return {
    numTotalTests: 20,
    numPassedTests: 20,
    numFailedTests: 0,
    numPendingTests: 0,
    numTotalTestSuites: 4,
    startTime: 0,
    endTime: 65000,
    suites: [
      { path: "packages/a/a.test.ts", runtimeMs: 900, execError: false, failingTests: [] },
      { path: "packages/a/b.test.ts", runtimeMs: 4200, execError: false, failingTests: [] }
    ],
    ...overrides
  };
}

describe("composeReport", () => {
  it("renders a glanceable green report with detail collapsed", () => {
    const markdown = composeReport({
      chunks: [
        { id: "0", stats: chunkStats() },
        { id: "1", stats: chunkStats({ endTime: 30000 }) }
      ],
      expectedChunkIds: [0, 1],
      testResult: "success",
      canaryResult: "success"
    });

    expect(markdown).toContain("## 🧪 Test report");
    expect(markdown).toContain("✅ **40 tests passed**");
    expect(markdown).toContain("8 suites over 2 chunks");
    expect(markdown).toContain("slowest chunk 1m 5s");
    expect(markdown).toContain("reporting canary ✅");
    expect(markdown).toContain("<details><summary>Per-chunk breakdown</summary>");
    expect(markdown).toContain("<details><summary>⏱️ Slowest suites across the run</summary>");
    expect(markdown).not.toContain("❌");
    expect(markdown).not.toContain("⚠️");
  });

  it("lists every failing test un-collapsed with a rerun command", () => {
    const markdown = composeReport({
      chunks: [
        { id: "0", stats: chunkStats() },
        {
          id: "1",
          stats: chunkStats({
            numFailedTests: 2,
            numPassedTests: 18,
            suites: [
              {
                path: "packages/b/broken.test.ts",
                runtimeMs: 100,
                execError: false,
                failingTests: ["renders the form", "submits the form"]
              },
              {
                path: "packages/b/crashed.test.ts",
                runtimeMs: null,
                execError: true,
                failingTests: []
              }
            ]
          })
        }
      ],
      expectedChunkIds: [0, 1],
      testResult: "failure",
      canaryResult: "success"
    });

    expect(markdown).toContain("❌ **2 of 40 tests failed**");
    expect(markdown).toContain("### ❌ Failing suites");
    expect(markdown).toContain(
      "- `packages/b/broken.test.ts` — renders the form _(chunk 1)_"
    );
    expect(markdown).toContain(
      "- `packages/b/crashed.test.ts` — suite failed to run _(chunk 1)_"
    );
    expect(markdown).toContain(
      "npx jest packages/b/broken.test.ts packages/b/crashed.test.ts --maxWorkers=1"
    );
  });

  it("warns visibly about chunks that reported no stats", () => {
    const markdown = composeReport({
      chunks: [{ id: "0", stats: chunkStats() }],
      expectedChunkIds: [0, 1, 2],
      testResult: "failure",
      canaryResult: "success"
    });

    expect(markdown).toContain("No stats received from chunk(s) 1, 2");
  });

  it("warns when the reporting canary did not pass", () => {
    const markdown = composeReport({
      chunks: [{ id: "0", stats: chunkStats() }],
      expectedChunkIds: [0],
      testResult: "success",
      canaryResult: "failure"
    });

    expect(markdown).toContain("reporting canary ❌");
    expect(markdown).toContain("failure reporting may be broken");
  });

  it("still produces a report when no stats exist at all", () => {
    const markdown = composeReport({
      chunks: [],
      expectedChunkIds: [],
      testResult: "skipped",
      canaryResult: "skipped"
    });
    expect(markdown).toContain("## 🧪 Test report");
  });
});

describe("readStatsDir", () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ci-report-test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("reads chunk ids from file names and flags unreadable files", () => {
    fs.writeFileSync(
      path.join(tempDir, "chunk-stats-7.json"),
      JSON.stringify(chunkStats())
    );
    fs.writeFileSync(path.join(tempDir, "chunk-stats-8.json"), "not json");

    const chunks = readStatsDir(tempDir);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].id).toBe("7");
    expect(chunks[0].stats.numTotalTests).toBe(20);
    expect(chunks[1].stats).toBeNull();
  });

  it("returns an empty list for a missing directory", () => {
    expect(readStatsDir(path.join(tempDir, "does-not-exist"))).toEqual([]);
  });
});

describe("formatDuration", () => {
  it("formats seconds and minutes", () => {
    expect(formatDuration(4200)).toBe("4s");
    expect(formatDuration(65000)).toBe("1m 5s");
    expect(formatDuration(NaN)).toBe("?");
  });
});
