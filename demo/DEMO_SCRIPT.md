# Euro Rounds: 60–90 s demo script

**Hook:** *"Posting about European startup funding every day means an hour of reading news sites. Euro Rounds does it automatically in n8n for about 35 cents a day. You just approve."*

**What the demo builds toward:** a funding round from this morning's news becomes a **fact-checked, ready-to-post card**, with the founders' photo, a verified source link and its AI cost of about 1 cent, approved in one click.

> ⚠️ **AI credits are used up** right now, so **don't click Execute** in n8n while recording. Show the **successful run from today** in the execution history instead (shot 3). Record **before 08:00 tomorrow**: after that, the daily run will put a "Payment required" error in the app's status banner, unless credits are back. That banner is also usable footage (see the optional shot 6b).

---

## Shot list (≈ 85 s)

| # | Time | On screen | Click / action | Voiceover |
|---|---|---|---|---|
| 1 | 0–10 s | **App** (`localhost:3000`), top of page: status banner + stats strip | Nothing. Slow scroll down ~100 px | "This is Euro Rounds. Every morning at eight it finds the funding rounds announced in Europe in the last 48 hours and drafts posts about them. Each run costs about 34 cents." |
| 2 | 10–28 s | **n8n** → *Euro Rounds – Daily* canvas (colored sections) | Press **1** (zoom to fit). Hover over the blue *Research* note, then the purple *Pick* note, then the green *Write + verify* note | "It's one n8n workflow. Claude Sonnet with web search does the research, the only step that needs the expensive model. The cheaper Haiku picks the top three and writes each post, then searches again to find the source article and re-check the amount." |
| 3 | 28–40 s | n8n → **Executions** tab → today's successful run (**#57**, 17:14) | Click **Executions** at the top, click run **#57**. The green path lights up. Click **Save Post (pending)** to show a saved post | "Here's a real run from today: two new rounds found, written and saved in about a minute. Every step is logged." |
| 4 | 40–62 s | **App** → *Medcotec* post | Scroll to Medcotec. Click **Bold** under the card. Hover the **Source** button, then the **X version 2xx/280** counter, then **Claude cost $0.013** | "In the review app every post has a source link, an X version under 280 characters, and its own AI cost, about a cent. One click turns it into a poster with the founders' photo from the article." |
| 5 | 62–75 s | Same post | Click **Download image (1080×1080)**, then **Copy post** (toast appears), then **Approve** (toast, the post moves to the *Approved* tab) | "Download the card, copy the text, approve. Nothing is published without a human saying yes." |
| 6 | 75–88 s | Top of app → **How it works · right-sized AI · edge cases** | Click to expand. Scroll slowly over the edge-case table | "And it's built to hold up: retries, error branches and an error workflow, so nothing fails silently. Euro Rounds: European funding, ready to post." |
| 6b *(optional, instead of 6)* | 75–88 s | App status banner showing **Error at step "Claude: Research" / Payment required** (after tomorrow 08:00 if credits aren't back) | Nothing. Zoom on the banner | "Even when the AI provider ran out of credits, the pipeline didn't break silently. It logged exactly which step failed and why." |

Tip: record the voiceover separately, after the screen recording, and lay it over in the edit. It's easier than talking while clicking.

## OpenScreen edits

**Zoom in (about 1.6–2×) on these key moments:**
1. Shot 1: the **"Claude cost / run $0.34"** stat tile
2. Shot 2: each colored note as you hover it (three short zooms, or one slow pan)
3. Shot 4: the card switching **Classic → Bold** (the money shot; hold the zoom for 3 s)
4. Shot 4: **Claude cost $0.013** in the card footer
5. Shot 5: the **Approve** click and the post moving to *Approved*

**Speed up (3–4×):**
- n8n page loads and the canvas opening (shot 2 start)
- The executions list loading and opening #57 (shot 3)
- Scrolling between posts (shot 4 start)
- Any wait for the article photo ("Looking for a photo in the article…")

## Export settings

- **Video (YouTube / LinkedIn):** 16:9, **1920×1080**, MP4 (H.264), 30 fps, high quality. Set a background or padding in OpenScreen so the 1440-wide window fits 16:9 without black bars. Keep it **under 90 s**. LinkedIn autoplays muted, so add captions (or burn in the key lines).
- **GIF for the README:** only shot 4 (Classic → Bold switch + Approve), **6–10 s**, **800 px wide**, 12–15 fps, loop. If OpenScreen's export has no GIF option, export that part as MP4 and convert it. I can install `ffmpeg` with Homebrew if you want (I'll ask first).

## Pre-recording checklist

- [ ] **Reset the data:** `./demo/reset.sh` (Pending 2, Approved 1, Rejected 9), then reload the app.
- [ ] **App running:** `npm run dev` → http://localhost:3000 loads with posts (not the "Can't reach n8n" error).
- [ ] **Open the Medcotec post once before recording**, so its article photo is cached and the Bold button works immediately.
- [ ] **Focus / Do Not Disturb on** (Control Center → Focus), so no notifications show. Quit Slack, Discord, Telegram, Messages and Mail.
- [ ] **Use a fresh Chrome window** with only these 3 tabs, in this order:
  1. `http://localhost:3000` (the app)
  2. `https://mukhtarams.app.n8n.cloud/workflow/TQoElZNaLM9peqZm` (Daily canvas)
  3. `https://mukhtarams.app.n8n.cloud/workflow/TQoElZNaLM9peqZm/executions/57` (today's successful run)
- [ ] **Hide the bookmarks bar** (Cmd+Shift+B). Use a Chrome profile without personal extensions, or hide them.
- [ ] **Browser zoom 100%** (Cmd+0) for n8n; **110%** for the app (Cmd+= once) so the text reads well in the video.
- [ ] **Window size 1440×810 (16:9):**
  `osascript -e 'tell application "Google Chrome" to set bounds of front window to {0, 25, 1440, 835}'`
- [ ] **Hide the macOS Dock** (Option+Cmd+D) and set the menu bar to auto-hide, or let OpenScreen record only the Chrome window.
- [ ] Mouse cursor: turn on cursor highlighting/smoothing in OpenScreen if available.

## What to keep off camera (sensitive)

| Don't show | Why |
|---|---|
| **n8n → Euro Rounds – API → Executions** (any run) | Each execution stores the request headers, **including the `x-euro-rounds-key` secret** |
| **n8n → Credentials** tab, or opening *Euro Rounds App Key* | The header-auth credential holds the same secret |
| **`.env.local`** in an editor or terminal (`cat`, VS Code) | Contains `EURO_ROUNDS_KEY` |
| **n8n user menu / Settings** (avatar, bottom left) and any **project picker** dropdown | Shows your name and account email |
| Other Chrome tabs and windows (LinkedIn messages, Gmail…) | Personal names and messages |
| Optional: the address bar `mukhtarams.app.n8n.cloud` | Shows your n8n subdomain (your name). Not secret, so blur it if you prefer |

Safe to show: the app (it holds no secrets and the key stays on the server), the Daily workflow canvas and its executions, the Error Handler, the Agent's Build tab, and the data tables.
