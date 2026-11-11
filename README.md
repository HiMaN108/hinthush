<p align="center"><img src="extension/icons/icon128.png" width="96" alt="HintHush icon"></p>

<h1 align="center">HintHush</h1>

<p align="center">A Chrome extension that hides "Click &amp; hold to reveal" hint labels, and helps you test your own blurred-quiz pages before they go live.</p>

---

## Features

- **Hides hint labels on any website.** Text like "Click & hold to reveal", "Click and hold to reveal" or "Hold to reveal" disappears. Images, diagrams and answer options are never hidden.
- **Reveals blurred content on your own local pages.** On `localhost`, `127.0.0.1`, `*.localhost` and `*.test`, blurred questions are shown all at once so you can check your quiz layout quickly. This feature never runs on live websites.
- **Friendly popup.** Live counts for the current page, on/off switches, *Pause on this site*, and a one-click *Allow on this site* when Chrome's site access is set to "On click".
- **Settings page.** Add your own label phrases, manage paused sites, reset to defaults. Changes apply instantly.
- **Welcome guide** on first install, and a count on the toolbar badge.
- Light and dark mode. No data collection: see [PRIVACY.md](PRIVACY.md).

## Install (developer mode)

1. Download or clone this repository.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and choose the `extension` folder.
4. Pin **HintHush** from the puzzle-piece menu.
5. Set **Details → Site access → On all sites**, or use **Allow on this site** in the popup.

## Try it on the demo quiz

The repo includes a demo quiz with hold-to-reveal spotlight questions, including diagram questions, and a Playwright test that loads the extension and answers the demo.

```bash
npm install
npx playwright install chromium

npm run demo              # serves the demo quiz at http://localhost:5173
npm run answer            # opens Chromium with HintHush loaded and answers the demo quiz
HEADLESS=1 npm run answer # same, without a window
```

## Package for the Chrome Web Store

```bash
npm run package   # creates dist/hinthush-<version>.zip
```

## Project structure

```
extension/          The Chrome extension (Manifest V3)
  manifest.json
  settings.js       Shared settings and helpers
  labelhide.js      Hides hint labels (all sites)
  content.js        Removes blur (local pages only)
  background.js     Toolbar badge, welcome page on install
  popup.*           Toolbar popup
  options.*         Settings page
  welcome.html      How-to guide
  ui.css            Shared styles
  icons/
demo/               Demo quiz page with hold-to-reveal spotlight
automation/         Demo server and Playwright test
```
