# Branch Strategy

**Document ID:** BRANCH-EMAILSORT-001  
**Version:** 1.0  
**Date:** 2026-03-10  
**Status:** Approved

---

## Current Strategy: main Only

This is a single-developer project. All commits are made directly to `main`.

**Rationale:**
- Eliminates merge overhead for solo development.
- GitHub Actions deploys on every push to `main` — fast feedback loop.
- GitHub Pages requires a public repo on the free plan; this constraint is already met.
- If the project moves to multi-developer, migrate to the feature-branch strategy below.

---

## Branch Protection Rules (apply to `main`)

Configure in **GitHub → Settings → Branches → Add branch protection rule** for `main`:

| Rule | Setting |
|---|---|
| Require status checks to pass before merging | ✅ Enabled — select the CI job name once the Actions workflow exists |
| Require branches to be up to date before merging | ✅ Enabled |
| Do not allow bypassing the above settings | ✅ Enabled |
| Allow force pushes | ❌ Disabled |
| Allow deletions | ❌ Disabled |

---

## Commit Message Convention

Use the following prefix convention for all commits. This is not enforced by tooling at this stage but should be followed consistently:

| Prefix | Use for |
|---|---|
| `feat:` | New feature or capability |
| `fix:` | Bug fix |
| `chore:` | Tooling, config, dependencies |
| `docs:` | Documentation only |
| `test:` | Tests only |
| `refactor:` | Code restructure, no behaviour change |
| `ci:` | GitHub Actions / CI pipeline changes |

**Examples:**
```
feat: add Gmail API sync function
fix: correct Firestore security rule for training collection
chore: upgrade firebase-admin to 12.1.0
ci: add ANTHROPIC_API_KEY to GitHub Actions secrets
docs: update README with local emulator setup steps
```

---

## Future Migration: Feature Branch Workflow

If a second developer joins, migrate to this strategy:

```
main          — production; protected; deploys to GitHub Pages on push
  └── feature/1.1-github-setup
  └── feature/2.1-gmail-api
  └── fix/confidence-threshold-bug
```

**Rules under feature branch workflow:**
- No direct commits to `main`.
- All work on `feature/{task-id}-{short-description}` branches.
- Merge via Pull Request; at least one approval required.
- Branch deleted after merge.
- CI must be green before merge is permitted.

---

## Revision History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-03-10 | Initial — main-only strategy approved by stakeholder |
