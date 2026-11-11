# HintHush Privacy Policy

_Last updated: November 11, 2026_

HintHush is a Chrome extension that hides "Click & hold to reveal" style hint labels on web pages, and removes blur on pages served from your own computer (localhost) for testing.

## What data HintHush collects

**None.** HintHush does not collect, store, sell, or send any personal information, browsing history, page content, or usage data.

## How it works

- All processing happens locally in your browser, on the page you are viewing.
- HintHush reads page text only to find hint labels such as "Click & hold to reveal", and hides them on that page. Nothing is saved or sent anywhere.
- Your settings (on/off switches, label phrases, paused sites) are stored with Chrome's `chrome.storage.sync`, which Chrome may sync between your own signed-in browsers. HintHush's developer has no access to it.
- HintHush makes no network requests and contains no analytics, ads, or tracking.

## Permissions

| Permission | Why it's needed |
|---|---|
| Access to websites (content scripts) | To find and hide hint labels on the pages you visit. |
| `storage` | To remember your settings. |
| `activeTab` | So the toolbar popup can show the current site and offer "Allow on this site". |

## Contact

Questions about this policy: open an issue at https://github.com/HiMaN108/hinthush/issues
