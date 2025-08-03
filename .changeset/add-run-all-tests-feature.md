---
"affogato": minor
---

feat: add configurable full test execution feature

- Add `run_all_tests_packages` input for specifying packages that trigger running all tests
- Add `run_all_tests_config` input for configuration file support
- Add `run_all_tests` output flag to indicate when all tests should be run
- Enable running all tests when specified packages (e.g., vitest, playwright) are updated
- Support both inline package configuration and external JSON config files
