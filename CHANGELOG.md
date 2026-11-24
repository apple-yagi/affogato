# affogato

## 0.0.6

### Patch Changes

- 315c3e0: Log Compare API failures and fall back to the PR base SHA instead of HEAD^ when merge base is unavailable
- 5b4e1f3: Fix changed files with non-ASCII paths being ignored due to Git path quoting

## 0.0.5

### Patch Changes

- ecbd2ac: Bump the action runtime from `node20` to `node24`, as GitHub Actions runners no longer support Node.js 20

## 0.0.4

### Patch Changes

- 57a9f2c: feat: add configurable test file patterns
