# Autofix Agent (scaffold)

This is a minimal scaffold for an autofix agent for the Latela repo. It runs project checks (tests, lints, builds) and writes a structured `results.json` used by downstream automation.

How to run locally:

```bash
# Make executable if necessary
chmod +x tools/autofix-agent/run.js

# Run the agent
node tools/autofix-agent/run.js
```

Output:
- `tools/autofix-agent/results.json` — contains `runs` array with `stdout`, `stderr`, and `status` for each command.

Next steps you might want me to implement:
- Add GitHub Action to run this agent on push and upload the `results.json` as an artifact.
- Parse failures and open GitHub issues or create PRs with suggested fixes.
- Enhance runner to attempt automatic fixes (e.g., `eslint --fix`), run tests again, and create branches/PRs.
