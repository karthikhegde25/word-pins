# Upload Word Pins to GitHub

You do **not** need GitHub only to use the plugin on Android.
You **do** need GitHub if you want:

- a public page for the plugin
- install with BRAT on Android
- later add it to the official Obsidian plugin list

Author is already set:

- Name: Karthik Hegde
- GitHub: karthikhegde25
- Repo: https://github.com/karthikhegde25/word-pins

## Files that must be in the repo root

Upload all of these:

```
word-pins/
  main.js
  manifest.json
  styles.css
  README.md
  LICENSE
  versions.json
  .gitignore
  UPLOAD-TO-GITHUB.md
  community-directory-entry.json
  .github/workflows/release.yml
```

Obsidian only downloads these three from a GitHub **Release**:

- `main.js`
- `manifest.json`
- `styles.css`

A repo without a Release is not enough for BRAT or the official store.

---

## Method 1 — GitHub website (no git command)

### 1. Create the repo

1. Open [https://github.com/new](https://github.com/new)
2. Repository name: `word-pins`
3. Public
4. Do **not** add a README, license, or .gitignore on this screen (this folder already has them)
5. Create repository

### 2. Upload the files

1. On the empty repo page, click **uploading an existing file**
2. Drag every file and folder from this `word-pins` folder
3. Commit message: `Initial release 1.0.0`
4. Commit changes

If the website will not upload the `.github` folder, skip it. You can still make a Release by hand.

### 3. Create Release 1.0.0 (required)

1. Repo page → right side → **Releases** → **Create a new release**
2. Choose a tag: type `1.0.0` → Create new tag  
   Use `1.0.0` only. Do **not** use `v1.0.0`
3. Release title: `1.0.0`
4. Description: `First release. Pin words in long notes, jump back, delete pins. Works on Android.`
5. Attach these 3 files from this folder:
   - `main.js`
   - `manifest.json`
   - `styles.css`
6. Click **Publish release**

The tag name must match `"version"` in `manifest.json`. That is already `1.0.0`.

### 4. Use it on Android from GitHub

Install **BRAT** from Community plugins, then add:

```
karthikhegde25/word-pins
```

Enable **Word Pins**. Sync is not required for BRAT if the phone can reach GitHub.

---

## Method 2 — git commands

```bash
cd word-pins

# author is already karthikhegde25

git init
git add .
git commit -m "Initial release 1.0.0"
git branch -M main
git remote add origin https://github.com/karthikhegde25/word-pins.git
git push -u origin main

git tag 1.0.0
git push origin 1.0.0
```

Then on GitHub: Releases → create release from tag `1.0.0` → attach `main.js`, `manifest.json`, `styles.css` → Publish.

If GitHub Actions is enabled, pushing tag `1.0.0` can create that release for you. On the repo: Settings → Actions → General → Workflow permissions → Read and write permissions.

---

## Later: official Obsidian plugin list

GitHub + a Release is the first part. The official in-app list is extra.

1. Make sure the repo is public
2. Release `1.0.0` exists with the 3 files attached
3. Sign in at the [Obsidian Community developer dashboard](https://obsidian.md/blog/future-of-plugins)
4. Connect GitHub and submit this repo

Or use the older method: pull request on [obsidianmd/obsidian-releases](https://github.com/obsidianmd/obsidian-releases) using the JSON in `community-directory-entry.json`.

Rules that already match this project:

- `id` is `word-pins` (lowercase, hyphens, no `obsidian`)
- `isDesktopOnly` is `false` (Android allowed)
- description ends with a period
- LICENSE is present
- README is present

After it is approved, people can install it on Android from Settings → Community plugins → Browse, with no GitHub account.

---

## Checklist before you click Publish

- [ ] Author is `karthikhegde25` (already set)
- [ ] LICENSE copyright is `karthikhegde25` (already set)
- [ ] README BRAT line is `karthikhegde25/word-pins` (already set)
- [ ] Repo name is `word-pins`
- [ ] Repo is public
- [ ] Release tag is exactly `1.0.0`
- [ ] Release has `main.js`, `manifest.json`, `styles.css` attached
