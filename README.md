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
- ☕️ Minimal configuration, high impact

---

## 🛠 Usage

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
      - run: npm run test ${{ steps.affogato.outputs.affected_tests }}
```

## ⚙️ Inputs

| Name       | Description                                                          | Required | Default           |
| ---------- | -------------------------------------------------------------------- | -------- | ----------------- |
| `token`    | GitHub Token to fetch changed files using the GitHub API             | ✅ Yes    | —                 |
| `tsconfig` | Path to the project's `tsconfig.json` used for dependency resolution | ❌ No     | `./tsconfig.json` |

## 📤 Outputs

| Name             | Description                               |
| ---------------- | ----------------------------------------- |
| `affected_tests` | Space-separated list of test files to run |

## 🧪 How It Works

1. affogato uses the GitHub API (via token) to detect changed files between the base and head commits.
2. If tsconfig is provided (or defaulted), it parses the TypeScript project and resolves module dependencies.
3. Based on the dependency graph, it finds test files (e.g. *.(test|spec).(ts|tsx)) affected by the change.
4. The list of affected test files is returned via the affected_tests output.

## 📄 License

[MIT](/LICENSE)
