<div align="center">

# 📰 SerpNews — AI News Intelligence & Timeline Tracker

Turn scattered news coverage into clear, chronological, fact-checked stories — with an optional Gen-Z "Tea" mode and 45-second audio briefings.

**[🔗 Live Demo](https://serpnews-ai-news-intelligence-timeline-tracker.ai.studio/)**

</div>

---

## What is SerpNews?

Most news reads like disconnected headlines. SerpNews pulls live articles via **SerpAPI**, clusters related coverage into a single **Story Hub**, and uses **Gemini** to generate an interactive timeline, a verified-vs-disputed breakdown, and a plain-language AI brief — so you can understand a developing story in seconds instead of reading a dozen articles.

## ✨ Features

- **🔄 Sync Live Wire** — pulls fresh articles in real time from SerpAPI's Google News engine
- **📚 Developing Stories vs. All News Wire** — toggle between AI-clustered Story Hubs and the raw, unclustered article feed
- **🧭 Story Hub** — an interactive timeline of every milestone in a story, each linked to its underlying source articles
- **✅ Verified / Disputed Tracking** — a "How It Changed" view separating Verified, Unverified, Disputed, and Corrected claims, with full source attribution
- **🍵 News Tea Mode** — flip any story into a casual, Gen-Z-style rewrite of the same facts; hit **Respin the Tea** to regenerate
- **🔊 45-Second Audio Briefing** — listen to an AI-generated spoken flash briefing of any story
- **🔎 Search** — look up any topic, person, or event and get the full Story Hub treatment on demand
- **🔗 Source linking** — every card links straight back to the original article on the publisher's site

## 🛠 Tech Stack

- **Frontend:** React 19, Vite 8, Tailwind CSS 4, TypeScript
- **Backend:** Express 4 + `tsx` (custom Node server, Vite in middleware mode for dev)
- **AI:** Google Gemini (`@google/genai`) for clustering, summarization, Tea mode, and TTS audio briefings
- **Data & Database:** SerpAPI (Google News engine) powers the entire database — every article and Story Hub is sourced live from SerpAPI, then synced into a local JSON store (`data/news_db.json`) rather than a traditional hosted database
