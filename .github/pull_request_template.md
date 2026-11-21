## What and why

<!-- Short description of the change and the reason for it. -->

## Checklist

- [ ] Commits are signed off (DCO, `git commit -s`).
- [ ] The PR title is a conventional commit (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- [ ] New or changed rule: references entry, vulnerable fixture, clean fixture and eval case included (see CONTRIBUTING.md).
- [ ] `npm test`, `node scripts/lint.mjs .` and `claude plugin validate .` pass locally.
- [ ] No real secrets or private code in the diff (fixtures use intentionally fake values only).
- [ ] Evals run by the maintainer (contributors do not need to run them; CI never calls a model).
