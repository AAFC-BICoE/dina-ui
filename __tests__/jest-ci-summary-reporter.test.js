/**
 * Tests the CI failure-reporting digest (jest-ci-summary-reporter.js) on every run.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

const CiSummaryReporter = require("../jest-ci-summary-reporter");

const ROOT_DIR = path.resolve(__dirname, "..");

function makeReporter() {
  return new CiSummaryReporter({ rootDir: ROOT_DIR });
}

function suiteResult(overrides = {}) {
  return {
    testFilePath: path.join(ROOT_DIR, "packages/example/some.test.ts"),
    numFailingTests: 0,
    testExecError: undefined,
    perfStats: { start: 0, end: 1200, runtime: 1200 },
    testResults: [],
    ...overrides
  };
}

function aggregatedResults(overrides = {}) {
  return {
    numPassedTests: 5,
    numFailedTests: 0,
    numTotalTestSuites: 1,
    testResults: [suiteResult()],
    ...overrides
  };
}

describe("CiSummaryReporter markdown digest", () => {
  it("renders a one-line summary plus collapsed slowest suites on green runs", () => {
    const markdown = makeReporter()._buildMarkdown(
      aggregatedResults({
        numTotalTestSuites: 2,
        testResults: [
          suiteResult({ perfStats: { start: 0, end: 500, runtime: 500 } }),
          suiteResult({
            testFilePath: path.join(ROOT_DIR, "packages/example/slow.test.ts"),
            perfStats: { start: 0, end: 3200, runtime: 3200 }
          })
        ]
      })
    );

    expect(markdown).toContain("### ✅ 5 tests passed (2 suites)");
    expect(markdown).toContain("Slowest suites");
    // Slowest suite listed first, as a repo-relative path with seconds
    expect(markdown.indexOf("packages/example/slow.test.ts")).toBeLessThan(
      markdown.indexOf("packages/example/some.test.ts")
    );
    expect(markdown).toContain("3.2 s");
    expect(markdown).not.toContain("❌");
  });

  it("tolerates missing perfStats on green runs", () => {
    const markdown = makeReporter()._buildMarkdown(
      aggregatedResults({ testResults: [suiteResult({ perfStats: undefined })] })
    );
    expect(markdown).toContain("### ✅");
    expect(markdown).not.toContain("Slowest suites");
  });

  it("lists each failing test with its message and a local rerun command", () => {
    const markdown = makeReporter()._buildMarkdown(
      aggregatedResults({
        numFailedTests: 1,
        testResults: [
          suiteResult({
            numFailingTests: 1,
            testResults: [
              {
                status: "failed",
                fullName: "MyComponent <renders>",
                failureMessages: [
                  "\u001b[31mExpected\u001b[39m: 2\n\u001b[32mReceived\u001b[39m: 1"
                ]
              },
              { status: "passed", fullName: "unrelated pass", failureMessages: [] }
            ]
          })
        ]
      })
    );

    expect(markdown).toContain("### ❌ 1 failing test(s) across 1 suite(s)");
    // HTML-sensitive characters in test names are escaped
    expect(markdown).toContain("MyComponent &lt;renders&gt;");
    // ANSI color codes are stripped from failure messages
    expect(markdown).not.toContain("\u001b");
    expect(markdown).toContain("Expected: 2");
    expect(markdown).not.toContain("unrelated pass");
    expect(markdown).toContain(
      "npx jest packages/example/some.test.ts --maxWorkers=1"
    );
  });

  it("reports suites that crashed before running any test", () => {
    const markdown = makeReporter()._buildMarkdown(
      aggregatedResults({
        testResults: [
          suiteResult({ testExecError: { message: "Cannot find module 'x'" } })
        ]
      })
    );

    expect(markdown).toContain("Suite failed to run");
    expect(markdown).toContain("Cannot find module 'x'");
  });

  it("truncates very long failure messages", () => {
    const markdown = makeReporter()._buildMarkdown(
      aggregatedResults({
        numFailedTests: 1,
        testResults: [
          suiteResult({
            numFailingTests: 1,
            testResults: [
              {
                status: "failed",
                fullName: "huge failure",
                failureMessages: ["x".repeat(10000)]
              }
            ]
          })
        ]
      })
    );

    expect(markdown).toContain("…(truncated)");
    expect(markdown.length).toBeLessThan(10000);
  });
});

describe("CiSummaryReporter onRunComplete", () => {
  const originalSummaryPath = process.env.GITHUB_STEP_SUMMARY;
  const originalStatsPath = process.env.JEST_CI_STATS_FILE;
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ci-summary-test-"));
    delete process.env.GITHUB_STEP_SUMMARY;
    delete process.env.JEST_CI_STATS_FILE;
  });

  afterEach(() => {
    if (originalSummaryPath === undefined) {
      delete process.env.GITHUB_STEP_SUMMARY;
    } else {
      process.env.GITHUB_STEP_SUMMARY = originalSummaryPath;
    }
    if (originalStatsPath === undefined) {
      delete process.env.JEST_CI_STATS_FILE;
    } else {
      process.env.JEST_CI_STATS_FILE = originalStatsPath;
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("is a no-op when GITHUB_STEP_SUMMARY is not set", () => {
    expect(() =>
      makeReporter().onRunComplete(new Set(), aggregatedResults())
    ).not.toThrow();
  });

  it("writes machine-readable chunk stats when JEST_CI_STATS_FILE is set", () => {
    const statsFile = path.join(tempDir, "chunk-stats-3.json");
    process.env.JEST_CI_STATS_FILE = statsFile;

    makeReporter().onRunComplete(
      new Set(),
      aggregatedResults({
        numTotalTests: 6,
        numFailedTests: 1,
        startTime: 1000,
        testResults: [
          suiteResult({
            numFailingTests: 1,
            testResults: [
              {
                status: "failed",
                fullName: "broken test",
                failureMessages: ["boom"]
              }
            ]
          })
        ]
      })
    );

    const stats = JSON.parse(fs.readFileSync(statsFile, "utf8"));
    expect(stats.numTotalTests).toBe(6);
    expect(stats.numFailedTests).toBe(1);
    expect(stats.suites).toHaveLength(1);
    expect(stats.suites[0].path).toBe("packages/example/some.test.ts");
    expect(stats.suites[0].failingTests).toEqual(["broken test"]);
    expect(stats.suites[0].runtimeMs).toBe(1200);
    expect(stats.suites[0].execError).toBe(false);
  });

  it("does not write stats when JEST_CI_STATS_FILE is not set", () => {
    makeReporter().onRunComplete(new Set(), aggregatedResults());
    expect(fs.readdirSync(tempDir)).toHaveLength(0);
  });

  it("appends the digest to the GITHUB_STEP_SUMMARY file", () => {
    const summaryFile = path.join(tempDir, "step-summary.md");
    process.env.GITHUB_STEP_SUMMARY = summaryFile;

    const reporter = makeReporter();
    reporter.onRunComplete(new Set(), aggregatedResults());
    reporter.onRunComplete(new Set(), aggregatedResults());

    const written = fs.readFileSync(summaryFile, "utf8");
    // Appends (rather than overwrites)
    expect(written.match(/### ✅/g)).toHaveLength(2);
  });
});
