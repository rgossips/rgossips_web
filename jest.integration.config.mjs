// Integration config — SAFE guard/contract suite against the deployed edge
// functions. Separate roots from the unit suite (__integration__/ vs __tests__/)
// so `npm test` stays fully offline. No coverage; longer timeout for real HTTP.
// next/jest loads .env.local → NEXT_PUBLIC_SUPABASE_URL + publishable key.
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  roots: ["<rootDir>/__integration__"],
  testTimeout: 30000,
  // next/jest skips .env.local under NODE_ENV=test — load it ourselves.
  setupFiles: ["<rootDir>/__integration__/setup-env.js"],
  // setup-env.js is a helper, not a test file.
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/__integration__/setup-env.js"],
  reporters: [
    "default",
    ["jest-html-reporters", { publicPath: "./test-results", filename: "integration-report.html", pageTitle: "RGossips integration (safe guard suite)", expand: true }],
    ["jest-junit", { outputDirectory: "./test-results", outputName: "integration-junit.xml" }],
  ],
};

export default createJestConfig(config);
