# Word Pins

Pin words or phrases inside a long Markdown note. Keep **many pins in the same file**. Each pin has a **time**. You can **delete** any pin.

Works on **desktop and Android**.

## What it does

- Pin the selected word, or the word under the cursor
- Many pins per note
- Each pin stores the word, line, and time
- Open the pin list and tap a pin to jump there
- Tap the trash button to delete one pin
- If you edit the note later, it tries to find the same word again

Pins are saved in the plugin data file. They do **not** change your Markdown text.

## How to use

1. Open a long note.
2. Select a word, or put the cursor on a word.
3. Run command **Word Pins: Pin selection**.
4. Open **Word Pins: Open pin list**, or tap the pin icon in the left ribbon.
5. Tap a pin to jump. Tap trash to delete.

### Android

1. Select the word in the note.
2. Open the command palette and run **Pin selection**.
3. Add that command to the mobile toolbar:
   Settings → Mobile → configure toolbar (or use the Commander plugin).
4. Open the pin list from the ribbon pin icon or **Open pin list**.

On desktop you can also right-click and choose **Pin word**.

## Install from GitHub

After you publish a GitHub **Release** named `1.0.0` with these files attached:

- `main.js`
- `manifest.json`
- `styles.css`

you can install it on any device, including Android:

### Option A — BRAT (easy)

1. Install the community plugin **BRAT**.
2. BRAT → Add beta plugin.
3. Paste: `karthikhegde25/word-pins`
4. Enable **Word Pins**.

### Option B — Manual

Copy these files into your vault:

```
YourVault/.obsidian/plugins/word-pins/
  main.js
  manifest.json
  styles.css
```

Then enable **Word Pins** in Settings → Community plugins.

If the vault syncs to your phone, the plugin appears on Android too. Enable it once on the phone.

## Commands

| Command | What it does |
|---|---|
| Pin selection | Save a pin at the word or selection |
| Open pin list | Show the sidebar list |
| Jump to latest pin in this note | Go to the newest pin in the open file |
| Delete all pins in this note | Clear pins for the open file only |

Settings has a button to delete every pin.

## Notes

- Pins follow a file rename.
- Pins for a deleted file are removed.
- Jump searches for the pinned text if the line number moved.

## For developers

See [UPLOAD-TO-GITHUB.md](UPLOAD-TO-GITHUB.md) for the exact GitHub and release steps.
