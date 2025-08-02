# Add package.json dependency change detection with monorepo support

---

"affogato": minor
---

Add package.json dependency change detection with monorepo support

- Detect library version changes in package.json files and include tests for files that import those libraries in affected_tests output
- Support monorepo environments by checking workspace root package.json changes
- Handle both direct and transitive dependencies correctly (e.g., use-react-components → react-component → react)
- Optimize GitHub API calls by eliminating duplicate requests
- Add comprehensive test coverage for new functionality
