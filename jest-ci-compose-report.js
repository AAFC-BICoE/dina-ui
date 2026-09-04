"use strict";

/**
 * Composes the run-level "test report" job summary from the per-chunk stats
 * JSON files that jest-ci-summary-reporter.js writes (via JEST_CI_STATS_FILE)
 * and each test-chunk job uploads as an artifact. Runs on EVERY push.
 *
 * CLI: node jest-ci-compose-report.js <stats-dir>
 * Env: EXPECTED_CHUNKS (JSON array of chunk ids, from the setup job),
 *      TEST_RESULT (the test-chunk GitHub job result, e.g. "success").
 * Prints markdown to stdout (appended to $GITHUB_STEP_SUMMARY by the caller).
 */

const fs = require("fs");
const path = require("path");

const SLOWEST_SUITES_SHOWN = 10;

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) {
    return "?";
  }
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function readStatsDir(statsDir) {
  let entries = [];
  try {
    entries = fs.readdirSync(statsDir).filter(name => name.endsWith(".json"));
  } catch {
    return [];
  }
  const chunks = [];
  for (const name of entries.sort()) {
    try {
      const stats = JSON.parse(
        fs.readFileSync(path.join(statsDir, name), "utf8")
      );
      const idMatch = name.match(/(\d+)\.json$/);
      chunks.push({ id: idMatch ? idMatch[1] : name, stats });
    } catch (error) {
      chunks.push({ id: name, stats: null, error: String(error) });
    }
  }
  return chunks;
}

function composeReport({ chunks, expectedChunkIds, testResult }) {
  const valid = chunks.filter(chunk => chunk.stats);
  const broken = chunks.filter(chunk => !chunk.stats);

  const totals = valid.reduce(
    (accumulator, chunk) => ({
      tests: accumulator.tests + (chunk.stats.numTotalTests || 0),
      passed: accumulator.passed + (chunk.stats.numPassedTests || 0),
      failed: accumulator.failed + (chunk.stats.numFailedTests || 0),
      pending: accumulator.pending + (chunk.stats.numPendingTests || 0),
      suites: accumulator.suites + (chunk.stats.numTotalTestSuites || 0)
    }),
    { tests: 0, passed: 0, failed: 0, pending: 0, suites: 0 }
  );

  const allSuites = valid.flatMap(chunk =>
    chunk.stats.suites.map(suite => ({ ...suite, chunk: chunk.id }))
  );
  const failingSuites = allSuites.filter(
    suite => suite.failingTests.length > 0 || suite.execError
  );
  const slowestChunkMs = Math.max(
    0,
    ...valid.map(chunk => chunk.stats.endTime - chunk.stats.startTime)
  );

  const lines = ["## 🧪 Test report", ""];

  const anyFailure =
    totals.failed > 0 || failingSuites.length > 0 || testResult !== "success";
  lines.push(
    [
      anyFailure
        ? `❌ **${totals.failed} of ${totals.tests} tests failed**`
        : `✅ **${totals.passed} tests passed**`,
      totals.pending > 0 ? `${totals.pending} skipped` : null,
      `${totals.suites} suites over ${valid.length} chunks`,
      `slowest chunk ${formatDuration(slowestChunkMs)}`
    ]
      .filter(Boolean)
      .join(" · "),
    ""
  );

  const missingChunks = expectedChunkIds.filter(
    id => !valid.some(chunk => String(chunk.id) === String(id))
  );
  for (const chunk of broken) {
    lines.push(`⚠️ stats from chunk \`${chunk.id}\` could not be read`, "");
  }
  if (missingChunks.length > 0) {
    lines.push(
      `⚠️ **No stats received from chunk(s) ${missingChunks.join(", ")}** — ` +
        "those jobs may have crashed before jest finished; check their logs.",
      ""
    );
  }
  if (failingSuites.length > 0) {
    lines.push(`### ❌ Failing suites`, "");
    for (const suite of failingSuites) {
      for (const testName of suite.failingTests) {
        lines.push(`- \`${suite.path}\` — ${testName} _(chunk ${suite.chunk})_`);
      }
      if (suite.execError) {
        lines.push(
          `- \`${suite.path}\` — suite failed to run _(chunk ${suite.chunk})_`
        );
      }
    }
    lines.push(
      "",
      "**Rerun locally:**",
      "",
      "```",
      `npx jest ${failingSuites.map(suite => suite.path).join(" ")} --maxWorkers=1`,
      "```",
      ""
    );
  }

  if (valid.length > 0) {
    lines.push("<details><summary>Per-chunk breakdown</summary>", "");
    lines.push("| Chunk | Suites | Tests | Failed | Time |");
    lines.push("|---|---|---|---|---|");
    for (const chunk of valid) {
      lines.push(
        `| ${chunk.id} | ${chunk.stats.numTotalTestSuites} | ` +
          `${chunk.stats.numTotalTests} | ${chunk.stats.numFailedTests} | ` +
          `${formatDuration(chunk.stats.endTime - chunk.stats.startTime)} |`
      );
    }
    lines.push("", "</details>", "");
  }

  const slowest = allSuites
    .filter(suite => Number.isFinite(suite.runtimeMs))
    .sort((a, b) => b.runtimeMs - a.runtimeMs)
    .slice(0, SLOWEST_SUITES_SHOWN);
  if (slowest.length > 0) {
    lines.push(
      "<details><summary>⏱️ Slowest suites across the run</summary>",
      ""
    );
    for (const suite of slowest) {
      lines.push(
        `- \`${suite.path}\` — ${formatDuration(suite.runtimeMs)} ` +
          `_(chunk ${suite.chunk})_`
      );
    }
    lines.push("", "</details>", "");
  }

  return `${lines.join("\n")}\n`;
}

function parseExpectedChunkIds(raw) {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

if (require.main === module) {
  const statsDir = process.argv[2];
  process.stdout.write(
    composeReport({
      chunks: statsDir ? readStatsDir(statsDir) : [],
      expectedChunkIds: parseExpectedChunkIds(process.env.EXPECTED_CHUNKS),
      testResult: process.env.TEST_RESULT
    })
  );
}

module.exports = { composeReport, readStatsDir, formatDuration };
