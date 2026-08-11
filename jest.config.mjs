// Jest config for the RGossips web unit-test suite.
//
// Pure-logic only: node environment (no jsdom/RTL). Tests live in the top-level
// __tests__/ dir (outside src/, so `next lint` never scans them and no
// production file is touched). Every run writes a human-readable HTML result
// file + a JUnit XML via the `reporters` below.
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // Coverage is scoped to the fully-tested pure modules so the % reflects the
  // logic under test (not untested network/DB siblings).
  collectCoverageFrom: [
    "src/utils/matchScore.js",
    "src/lib/brandProfile.js",
    "src/lib/plans.js",
    "src/utils/instagram-url.js",
    "src/lib/utils.js",
    "src/utils/indianCities.js",
    "src/utils/device-session.js",
    "src/lib/services.js",
  ],
  coverageReporters: ["text", "html", "lcov"],
  coverageThreshold: {
    global: { statements: 90, branches: 85, functions: 95, lines: 90 },
  },
  // Result files — written on EVERY `npm test` (no flags needed).
  reporters: [
    "default",
    ["jest-junit", { outputDirectory: "./test-results", outputName: "junit.xml" }],
  ],
};

export default createJestConfig(config);
