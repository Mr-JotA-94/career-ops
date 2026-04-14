# Git Workflow Guide — Career Ops

Reference for tracking changes properly from day one.

---

## Initial setup (run once)

```bash
# Inside your career-ops folder
git init
git remote add origin https://github.com/Mr-JotA-94/career-ops.git

# Set your identity (if not already set globally)
git config user.name "Johan Lopez"
git config user.email "your@email.com"
```

---

## First commit — getting everything in

```bash
git add .
git commit -m "feat: initial release v1.0 — Career Ops

Five-tool AI job search toolkit for professional immigrants in AU.
- Career Compass, JD Analyser, CV Tailor, Search Kit, Pipeline
- Local Node.js server, Groq/Llama backend
- Setup wizard with CV import
- Landing page (index.html) for GitHub Pages"

git branch -M main
git push -u origin main
```

---

## Enabling GitHub Pages (landing page goes live)

1. Go to your repo on GitHub
2. Settings → Pages
3. Source: **Deploy from a branch**
4. Branch: `main` / folder: `/ (root)`
5. Save

Your landing page will be live at:
`https://Mr-JotA-94.github.io/career-ops`

---

## Daily workflow

```bash
# Before starting work — pull latest
git pull

# After making changes — stage and commit
git add <filename>         # specific file
git add .                  # everything changed

git commit -m "type: short description"

git push
```

---

## Commit message format

Use this pattern — it makes your history readable at a glance:

```
type: short description (under 60 chars)

Optional longer explanation if needed.
```

**Types:**
| Type | When to use |
|------|-------------|
| `feat` | New feature or tool |
| `fix` | Bug fix |
| `improve` | Enhancement to existing feature |
| `ui` | Visual / layout change |
| `prompt` | AI prompt improvement |
| `docs` | README, comments, this file |
| `refactor` | Code cleanup, no behaviour change |
| `config` | server.mjs, package.json changes |

**Good examples:**
```bash
git commit -m "fix: CV tailor bullet formatting in docx export"
git commit -m "improve: JD analyser — add visa eligibility signal"
git commit -m "feat: add interview prep tool"
git commit -m "ui: landing page — mobile nav improvements"
git commit -m "prompt: compass — better hidden roles detection for AU market"
```

**Avoid:**
```bash
git commit -m "update"         # meaningless
git commit -m "fix stuff"      # too vague
git commit -m "wip"            # don't commit half-broken work to main
```

---

## Working on something experimental

```bash
# Create a feature branch so main stays stable
git checkout -b feat/interview-prep

# Work, commit as normal
git commit -m "feat: interview prep tool — initial structure"

# When ready, merge back to main
git checkout main
git merge feat/interview-prep
git push
```

---

## Tagging versions

```bash
# When you ship a meaningful update
git tag -a v1.1 -m "v1.1 — Added interview prep tool"
git push origin v1.1
```

---

## What NOT to commit

The `.gitignore` already handles this, but never manually add:

- `config.json` — contains your Groq API key and personal details
- `pipeline.json` — your personal application data  
- `.env` — API keys
- `resumes/` — generated CV files
- `node_modules/` — dependencies (reinstalled via `npm install`)

---

## Useful commands

```bash
git status                    # what's changed
git log --oneline -10         # last 10 commits
git diff                      # see what changed before staging
git stash                     # temporarily shelve changes
git stash pop                 # bring them back
```
