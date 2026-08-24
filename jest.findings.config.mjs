// Findings config — the RED suite.
//
// These tests assert the DESIRED state of an open Appendix A finding. They are
// EXPECTED TO FAIL, and a failure here is a finding still open, not a broken
// build. Each goes green on the day its fix ships, which makes this suite a
// self-maintaining findings register rather than a document someone has to
// remember to update.
//
// Deliberately NOT part of `npm test`: the blocking gate covers unit + deno +
// static analysis, and a permanently-red suite inside that gate would train
// everyone to ignore it. CI runs this with continue-on-error and publishes the
// report.
//
// It hits the LIVE project, so it obeys the same safety rules as
// __integration__/ — guard, read-only and refused paths only, enforced by the
// denylist in __integration__/safety.js.
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  roots: ["<rootDir>/__findings__"],
  testTimeout: 30000,
  setupFiles: ["<rootDir>/__integration__/setup-env.js"],
  reporters: [
    "default",
    [
      "jest-html-reporters",
      {
        publicPath: "./test-results",
        filename: "findings-report.html",
        pageTitle: "RGossips open findings (RED = still open)",
        expand: true,
      },
    ],
    ["jest-junit", { outputDirectory: "./test-results", outputName: "findings-junit.xml" }],
  ],
};

export default createJestConfig(config);
