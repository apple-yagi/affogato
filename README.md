<div align="center">
  <img src="logo/affogato.jpg" alt="affogato" width="250">
</div>

# ☕️ affogato

> Only test what's affected — pour your tests like espresso on just the changed files.

`affogato` is a GitHub Action that detects affected files from a pull request or commit, determines the relevant test targets, and runs only the necessary unit tests. It's like a hot shot of espresso, focused and efficient.

---

## 📦 Features

- 🔍 Detects affected files via `git diff`
- 🚀 Runs only necessary unit tests to save CI time
- ✅ Supports pull requests and push events
- 🧪 Configurable full test execution - runs all tests when specified packages are updated
- 📝 Flexible configuration via input parameters or config files
- ☕️ Minimal configuration, high impact

---

## 🛠 Usage

### Basic Usage

Add this to your GitHub Actions workflow:

```yaml
name: CI

on:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: apple-yagi/affogato@v1
        id: affogato
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      - run: npm install
      # Run all tests if run_all_tests is true, otherwise run only affected tests
      - if: steps.affogato.outputs.run_all_tests == 'true'
        run: npm run test
      - if: steps.affogato.outputs.run_all_tests != 'true' && steps.affogato.outputs.affected_tests != ''
        run: npm run test ${{ steps.affogato.outputs.affected_tests }}
```

### Advanced Usage with Package Configuration

Configure packages that should trigger running all tests:

```yaml
- uses: apple-yagi/affogato@v1
  id: affogato
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    run_all_tests_packages: "vitest,playwright,@testing-library/react,jest"
```

Or use a configuration file:

**affogato.config.json**

```json
{
  "runAllTestsPackages": [
    "vitest",
    "playwright",
    "@testing-library/react",
    "jest",
    "@storybook/react"
  ]
}
```

```yaml
- uses: apple-yagi/affogato@v1
  id: affogato
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    run_all_tests_config: "affogato.config.json"
```

## ⚙️ Inputs

| Name                     | Description                                                                              | Required | Default           |
| ------------------------ | ---------------------------------------------------------------------------------------- | -------- | ----------------- |
| `token`                  | GitHub Token to fetch changed files using the GitHub API                                 | ✅ Yes   | —                 |
| `tsconfig`               | Path to the project's `tsconfig.json` used for dependency resolution                     | ❌ No    | `./tsconfig.json` |
| `run_all_tests_packages` | Comma-separated list of package names that should trigger running all tests when updated | ❌ No    | —                 |
| `run_all_tests_config`   | Path to configuration file containing packages that should trigger running all tests     | ❌ No    | —                 |

## 📤 Outputs

| Name             | Description                                                      |
| ---------------- | ---------------------------------------------------------------- |
| `affected_tests` | Space-separated list of test files to run                        |
| `run_all_tests`  | Flag indicating whether all tests should be run (`true`/`false`) |

## 🧪 How It Works

1. **File Detection**: Uses the GitHub API to detect changed files between base and head commits
2. **Package Analysis**: Detects changes in `package.json` files to identify updated dependencies
3. **Smart Test Strategy**:

- If a configured test tool package (e.g., `vitest`, `playwright`) is updated → runs all tests (`run_all_tests: true`)
- Otherwise → analyzes TypeScript dependency graph to find affected test files

4. **Dependency Resolution**: Parses the TypeScript project using `tsconfig.json` to build a dependency graph
5. **Test File Discovery**: Finds test files (`*.(test|spec).(ts|tsx)`) affected by changes
6. **Output Generation**: Returns either a list of specific test files or a flag to run all tests

## 📄 License

[MIT](/LICENSE)
