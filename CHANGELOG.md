# affogato

## 0.2.1

### Patch Changes

- eeb3800: feat: enhance workspace root package analysis with GitHub API fallback

## 0.2.0

### Minor Changes

- c9a0644: feat: add configurable full test execution feature
  - Add `run_all_tests_packages` input for specifying packages that trigger running all tests
  - Add `run_all_tests_config` input for configuration file support
  - Add `run_all_tests` output flag to indicate when all tests should be run
  - Enable running all tests when specified packages (e.g., vitest, playwright) are updated
  - Support both inline package configuration and external JSON config files

## 0.1.0

### Minor Changes

- 0e25ff2: Add package.json dependency change detection with monorepo support
  - Detect library version changes in package.json files and include tests for files that import those libraries in affected_tests output
  - Support monorepo environments by checking workspace root package.json changes
  - Handle both direct and transitive dependencies correctly (e.g., use-react-components → react-component → react)
  - Optimize GitHub API calls by eliminating duplicate requests
  - Add comprehensive test coverage for new functionality
