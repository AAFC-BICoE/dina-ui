"use strict";

/**
 * Appends a markdown digest of the run to the GitHub Actions job summary ($GITHUB_STEP_SUMMARY), 
 * so test failures are readable on the workflow run's "Summary" page without opening any logs. 
 * Each failing suite is a collapsible section with the failing test names and messages, 
 * followed by a copy-pasteable command to rerun exactly those suites locally.
 *
 * No-op when GITHUB_STEP_SUMMARY is not set, and never fails the test run.
 */

const fs = require("fs");
const path = require("path");

// ANSI color/style escape codes that jest embeds in failure messages.
const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;
// Keep individual messages and the whole digest well under GitHub's 1MB
// job-summary limit.
const MAX_MESSAGE_CHARS = 2500;
const MAX_TOTAL_CHARS = 200000;
// How many suites to list in the collapsed "Slowest suites" section of a
// green run's digest.
const SLOWEST_SUITES_SHOWN = 5;

function stripAnsi(text) {
  return text.replace(ANSI_PATTERN, "");
}

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max)}\n…(truncated)` : text;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

class CiSummaryReporter {
  constructor(globalConfig) {
    this._globalConfig = globalConfig;
  }

  onRunComplete(_contexts, results) {
    const summaryFile = process.env.GITHUB_STEP_SUMMARY;
    if (summaryFile) {
      try {
        fs.appendFileSync(summaryFile, this._buildMarkdown(results));
      } catch (error) {
        // The digest is a convenience, never fail the test run over it
        console.error(
          `CiSummaryReporter: could not write job summary: ${error}`
        );
      }
    }

    // Machine-readable per-chunk stats, uploaded as a CI artifact and merged
    // into the run-level "test report" job summary by jest-ci-compose-report.js
    const statsFile = process.env.JEST_CI_STATS_FILE;
    if (statsFile) {
      try {
        fs.writeFileSync(
          statsFile,
          `${JSON.stringify(this._buildStats(results), null, 2)}\n`
        );
      } catch (error) {
        console.error(`CiSummaryReporter: could not write stats: ${error}`);
      }
    }
  }

  _buildStats(results) {
    const relativePath = suite =>
      path.relative(this._globalConfig.rootDir, suite.testFilePath);
    return {
      numTotalTests: results.numTotalTests,
      numPassedTests: results.numPassedTests,
      numFailedTests: results.numFailedTests,
      numPendingTests: results.numPendingTests,
      numTotalTestSuites: results.numTotalTestSuites,
      startTime: results.startTime,
      endTime: Date.now(),
      suites: results.testResults.map(suite => ({
        path: relativePath(suite),
        runtimeMs: suite.perfStats
          ? suite.perfStats.runtime ??
            suite.perfStats.end - suite.perfStats.start
          : null,
        execError: Boolean(suite.testExecError),
        failingTests: suite.testResults
          .filter(test => test.status === "failed")
          .map(test => test.fullName)
      }))
    };
  }

  _buildMarkdown(results) {
    const failedSuites = results.testResults.filter(
      suite => suite.numFailingTests > 0 || suite.testExecError
    );

    const relativePath = suite =>
      path.relative(this._globalConfig.rootDir, suite.testFilePath);

    if (failedSuites.length === 0) {
      // on green runs, still produce a (collapsed) digest, 
      // keeps this reporting path exercised on every run instead of only during failures
      const lines = [
        `### ✅ ${results.numPassedTests} tests passed (${results.numTotalTestSuites} suites)`,
        ""
      ];
      const slowest = results.testResults
        .filter(suite => suite.perfStats)
        .map(suite => ({
          suite,
          runtime:
            suite.perfStats.runtime ??
            suite.perfStats.end - suite.perfStats.start
        }))
        .filter(entry => Number.isFinite(entry.runtime))
        .sort((a, b) => b.runtime - a.runtime)
        .slice(0, SLOWEST_SUITES_SHOWN);
      if (slowest.length > 0) {
        lines.push("<details><summary>⏱️ Slowest suites</summary>", "");
        for (const entry of slowest) {
          lines.push(
            `- \`${relativePath(entry.suite)}\` — ${(
              entry.runtime / 1000
            ).toFixed(1)} s`
          );
        }
        lines.push("", "</details>", "");
      }
      return `${lines.join("\n")}\n`;
    }

    const lines = [
      `### ❌ ${results.numFailedTests} failing test(s) across ${failedSuites.length} suite(s)`,
      ""
    ];

    for (const suite of failedSuites) {
      lines.push(
        `<details><summary>❌ <code>${relativePath(suite)}</code></summary>`,
        ""
      );
      for (const test of suite.testResults) {
        if (test.status !== "failed") {
          continue;
        }
        lines.push(`- **${escapeHtml(test.fullName)}**`, "");
        const message = truncate(
          stripAnsi(test.failureMessages.join("\n")),
          MAX_MESSAGE_CHARS
        );
        // 4-backtick fence so failure messages containing ``` don't break it
        lines.push("````", message, "````", "");
      }
      if (suite.testExecError) {
        const message = truncate(
          stripAnsi(String(suite.testExecError.message || suite.testExecError)),
          MAX_MESSAGE_CHARS
        );
        lines.push("- **Suite failed to run**", "", "````", message, "````", "");
      }
      lines.push("</details>", "");
    }

    lines.push(
      "**Rerun the failing suites locally:**",
      "",
      "```",
      `npx jest ${failedSuites.map(relativePath).join(" ")} --maxWorkers=1`,
      "```",
      ""
    );

    let markdown = lines.join("\n");
    if (markdown.length > MAX_TOTAL_CHARS) {
      markdown = `${markdown.slice(0, MAX_TOTAL_CHARS)}\n\n…(digest truncated)\n\n`;
    }
    return markdown;
  }
}

module.exports = CiSummaryReporter;
