# TestScope - Impacted Unit Test File Detector

## Overview

**TestScope** detects which unit test files (`.test.ts` / `.test.tsx`) are affected by changed TypeScript files based on Git diffs.  
It uses `ts-morph` to analyze TypeScript import dependencies and accurately identifies tests impacted by your code changes.

This helps you run only relevant tests, speeding up your CI and local workflows.

---

## Features

- Detects impacted test files from changed TypeScript source files
- Uses static analysis (via `ts-morph`) to reverse-traverse import graphs
- Returns file paths relative to `process.cwd()` (ideal for test runners like Vitest or Node.js)

---

## Usage

```yaml
name: CI

on:
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-24.04

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1
          fetch-tags: false
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npx corepack enable pnpm
      - run: pnpm install --frozen-lockfile
      - uses: apple-yagi/test-scope@v0.0.1
        id: test_scope
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      - if: steps.test_scope.outputs.affected_tests != ''
        run: node --experimental-strip-types --test ${{ steps.test_scope.outputs.affected_tests }}
```

## LICENSE

[MIT](/LICENSE)
