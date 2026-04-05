# Workflow Templates

This directory contains temporary agent handoff files.
These files are generated during workflow execution and should NOT be committed to git.

## Files
- `PLAN.md` - Output from planning agent
- `REVIEW.md` - Output from review agent
- `FINDINGS.md` - Detailed findings and issues
- `FIXES.md` - Documentation of applied fixes

## Lifecycle
These files are temporary and regenerated for each workflow run.
Add `.claude/workflows/*.md` to your .gitignore.
