# Career Ops

**AI-powered job search toolkit for professional immigrants in Australia.**

Five locally-running tools that help qualified professionals navigate the Australian job market — CV tailoring, JD analysis, career path mapping, application tracking, and search strategy. No cloud, no account, no subscription.

→ **[careerops.com.au](https://Mr-JotA-94.github.io/career-ops)** *(landing page)*

---

## The tools

| Tool | What it does |
|------|-------------|
| 🧭 **Career Compass** | Maps your path from current role to target role in the AU market — bridge roles, hidden accelerators, visa notes |
| 🔍 **JD Analyser** | Decodes job descriptions — real requirements vs filler, ATS keywords, honest fit assessment |
| 📄 **CV Tailor** | Rewrites your CV for a specific role in your voice. Downloads as formatted .docx |
| 🎯 **Search Kit** | Search strategies, cover letter frameworks, outreach templates — tuned to AU norms |
| 📋 **Pipeline** | Tracks every application — status, contacts, follow-ups, CV version submitted |

---

## Quick start

### Requirements
- [Node.js v18+](https://nodejs.org)
- A free [Groq API key](https://console.groq.com) (no credit card)

### Setup

```bash
# 1. Clone
git clone https://github.com/Mr-JotA-94/career-ops.git
cd career-ops

# 2. Install dependencies
npm install

# 3. Start the server
node server.mjs

# 4. Open in browser
# → http://localhost:3131
```

The setup wizard will guide you through the rest (~8 minutes). Fill it in once — every tool is personalised from your profile.

---

## How it works

Career Ops runs a local Node.js server on port 3131. All tools are single-file HTML pages served from that server. Your profile is stored in `config.json` on your machine. Applications are tracked in `pipeline.json`.

The only external connection is to [Groq's API](https://console.groq.com) for AI processing. Your data is not stored, logged, or transmitted by Career Ops itself.

**Tech stack:** Node.js (no framework) · Plain HTML/CSS/JS · Groq / Llama 3.3 70B · `docx` for CV generation

---

## File structure

```
career-ops/
├── server.mjs          ← Local server (start here)
├── setup.html          ← Profile wizard (run first)
├── compass.html        ← Career Compass
├── jd-analyser.html    ← JD Analyser
├── cv-tailor.html      ← CV Tailor
├── search-kit.html     ← Search Kit
├── pipeline.html       ← Application Pipeline
├── about.html          ← About & disclaimer
├── index.html          ← Landing page (GitHub Pages)
├── config.json         ← Your profile (created by setup, gitignored)
├── pipeline.json       ← Your applications (created at runtime, gitignored)
├── resumes/            ← Generated CV files (gitignored)
└── package.json
```

---

## Privacy

Everything runs locally. No accounts. No cloud storage. No tracking.

The only data transmitted externally is the AI API call to Groq (your profile content + the job description being analysed). Career Ops does not store, log, or share your data.

---

## Disclaimer

Career Ops is a productivity and drafting tool — not a guarantee of employment outcomes. All AI-generated content should be reviewed before use and must accurately represent your actual qualifications and experience.

This is an independent project by **Johan Lopez**. Not affiliated with any recruitment agency, employer, or Australian government body.

---

## Roadmap

- [ ] Simplified setup (no terminal required)
- [ ] Interview preparation tool
- [ ] Salary benchmarking for AU roles
- [ ] Community resource hub for professional immigrants

---

## Contributing

Issues and suggestions welcome via [GitHub Issues](https://github.com/Mr-JotA-94/career-ops/issues).

---

**Built by Johan Lopez · Australia · v1.0**
