# Local Git Worktree Health Cleanup

Date: 2026-05-24

## Summary

The original repository checkout at `/Users/Renger/Documents/Codex Projects/AI Agent and Copilot templates` became unreliable for normal Git operations. Several read-oriented commands either hung or became inconsistent, which forced earlier branch updates to use verified GitHub API commits instead of normal local Git.

For continued Codex work, use the fresh clone:

`/Users/Renger/Documents/Codex Projects/AI Agent and Copilot templates - clean`

## Symptoms Observed

In the original checkout:

- `git worktree list` timed out.
- `git log --oneline --decorate -n 20` timed out.
- `git fsck --no-reflogs` timed out.
- `git diff --name-only` timed out.
- `git diff --check` timed out.
- `git status --short` and `git status --porcelain=v1` still returned, but the working tree was dirty on an older feature branch.

## Root Cause Found

The original checkout contains multiple linked-worktree metadata entries under `.git/worktrees/`.

Several `.git/worktrees/*/gitdir` files were marked by macOS as:

- `hidden`
- `compressed`
- `dataless`

Attempts to read those small `gitdir` metadata files hung. Because Git reads these files for worktree-aware operations, commands such as `git worktree list`, `git log`, and `git diff --check` were not reliable in that checkout.

No `.git/*.lock` files or `.git/worktrees/**/*.lock` files were found during inspection.

## Stale Process Cleanup

The following stale Git-related processes were found and terminated after inspection:

- `git rev-list --count HEAD --not --remotes=origin`
- `git rev-list --count fc28836993a8b3017698392f362a0d4155cbb37b..HEAD`
- `git diff ... fc28836993a8b3017698392f362a0d4155cbb37b --find-renames --numstat -z`

Temporary metadata inspection processes that hung while reading `.git/worktrees/*/gitdir` were also terminated.

## Repair Decision

The original checkout was not repaired in place because:

- It had an unrelated dirty working tree.
- Linked-worktree metadata reads were hanging.
- Removing or rewriting `.git/worktrees/` metadata could risk disrupting existing linked worktrees.

Instead, a fresh clone was created at:

`/Users/Renger/Documents/Codex Projects/AI Agent and Copilot templates - clean`

No raw exports, generated packages, `.env.local`, API responses, credentials, or private data were copied from the original checkout.

## Validation In Fresh Clone

The fresh clone passed these checks:

- `git status`
- `git fetch`
- `git checkout main`
- `git pull`
- `git diff --check`
- `git worktree list`
- `git log --oneline --decorate -n 20`
- `git fsck --no-reflogs`

The fresh clone reported:

- `main` at `9971f56e960aaca19ce4524f09e3101dce091b27`
- clean working tree
- one worktree only: the fresh clone itself
- no Git lock files

Ignore checks confirmed:

- `.env.local` is ignored by `.gitignore`
- generated `.yap` files are ignored by `.gitignore`

## Remaining Limitations

The original checkout still contains local uncommitted changes and linked-worktree metadata that may continue to hang when read. It should be treated as archival/unsafe for future Codex work until manually reviewed or replaced.

Do not run feature learning, runtime testing, plugin release, or merge operations from the original checkout.

## Recommended Working Directory

Use this path for future Codex work:

`/Users/Renger/Documents/Codex Projects/AI Agent and Copilot templates - clean`

Before resuming any feature or runtime milestone, start from this clean clone and verify:

- `git status`
- `git fetch`
- `git checkout main`
- `git pull`
- `git diff --check`
- `git worktree list`
