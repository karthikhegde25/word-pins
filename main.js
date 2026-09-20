/*
Word Pins — pin words/phrases in long Markdown notes and jump back later.
Multiple pins per file, timestamp on each pin, user can delete pins.
Works on desktop and Android (isDesktopOnly: false).
*/
"use strict";

const { Plugin, ItemView, MarkdownView, Notice, TFile, Menu, PluginSettingTab, Setting, setIcon } = require("obsidian");

const VIEW_TYPE = "word-pins-view";
const DEFAULT_DATA = { pins: [] };

function uid() {
	return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatWhen(ts) {
	const d = new Date(ts);
	const pad = (n) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fileName(path) {
	const parts = path.split("/");
	return parts[parts.length - 1] || path;
}

function wordAtCursor(editor) {
	const selected = editor.getSelection();
	if (selected && selected.trim()) {
		const from = editor.getCursor("from");
		return {
			text: selected.replace(/\s+/g, " ").trim(),
			line: from.line,
			ch: from.ch,
		};
	}
	const cursor = editor.getCursor();
	const lineText = editor.getLine(cursor.line) || "";
	if (!lineText) return null;
	const isWord = (ch) => /[\p{L}\p{N}_'-]/u.test(ch);
	let start = cursor.ch;
	let end = cursor.ch;
	while (start > 0 && isWord(lineText[start - 1])) start--;
	while (end < lineText.length && isWord(lineText[end])) end++;
	const text = lineText.slice(start, end).trim();
	if (!text) return null;
	return { text, line: cursor.line, ch: start };
}

function contextAround(editor, line, ch, text) {
	const lineText = editor.getLine(line) || "";
	const start = Math.max(0, ch - 24);
	const end = Math.min(lineText.length, ch + (text ? text.length : 0) + 24);
	return lineText.slice(start, end);
}

function findPinLocation(content, pin) {
	const lines = content.split("\n");
	const needle = pin.text;
	if (!needle) return { line: pin.line || 0, ch: pin.ch || 0 };

	if (pin.line >= 0 && pin.line < lines.length) {
		const lineText = lines[pin.line];
		const idx = lineText.indexOf(needle, Math.max(0, (pin.ch || 0) - 8));
		if (idx !== -1) return { line: pin.line, ch: idx };
		const idx2 = lineText.indexOf(needle);
		if (idx2 !== -1) return { line: pin.line, ch: idx2 };
	}

	let best = null;
	let bestDist = Infinity;
	for (let i = 0; i < lines.length; i++) {
		let from = 0;
		while (true) {
			const idx = lines[i].indexOf(needle, from);
			if (idx === -1) break;
			const dist = Math.abs(i - (pin.line || 0));
			if (dist < bestDist) {
				bestDist = dist;
				best = { line: i, ch: idx };
			}
			from = idx + 1;
		}
	}
	if (best) return best;
	return { line: Math.min(pin.line || 0, Math.max(0, lines.length - 1)), ch: pin.ch || 0 };
}

class WordPinsView extends ItemView {
	constructor(leaf, plugin) {
		super(leaf);
		this.plugin = plugin;
		this.filter = "current";
		this.query = "";
	}

	getViewType() {
		return VIEW_TYPE;
	}

	getDisplayText() {
		return "Word Pins";
	}

	getIcon() {
		return "pin";
	}

	async onOpen() {
		this.render();
	}

	async onClose() {}

	setFilter(filter) {
		this.filter = filter;
		this.render();
	}

	render() {
		const root = this.contentEl;
		root.empty();
		root.addClass("word-pins-view");

		const toolbar = root.createDiv({ cls: "word-pins-toolbar" });
		const currentBtn = toolbar.createEl("button", { text: "This note" });
		const allBtn = toolbar.createEl("button", { text: "All notes" });
		if (this.filter === "current") currentBtn.addClass("mod-cta");
		else allBtn.addClass("mod-cta");
		currentBtn.addEventListener("click", () => this.setFilter("current"));
		allBtn.addEventListener("click", () => this.setFilter("all"));

		const pinBtn = toolbar.createEl("button", { text: "Pin here" });
		pinBtn.addEventListener("click", () => this.plugin.pinFromActiveEditor());

		const searchWrap = toolbar.createDiv({ cls: "word-pins-search" });
		const search = searchWrap.createEl("input", {
			type: "search",
			placeholder: "Search pins…",
		});
		search.value = this.query;
		search.addEventListener("input", () => {
			this.query = search.value;
			this.renderList(list);
		});

		const list = root.createDiv({ cls: "word-pins-list" });
		this.renderList(list);
	}

	renderList(list) {
		list.empty();
		const activeFile = this.app.workspace.getActiveFile();
		const q = (this.query || "").trim().toLowerCase();

		let pins = this.plugin.data.pins.slice();
		if (this.filter === "current") {
			if (!activeFile) {
				list.createDiv({
					cls: "word-pins-empty",
					text: "Open a note to see pins for that file. Or tap All notes.",
				});
				return;
			}
			pins = pins.filter((p) => p.path === activeFile.path);
		}
		if (q) {
			pins = pins.filter((p) =>
				(p.text || "").toLowerCase().includes(q) ||
				(p.path || "").toLowerCase().includes(q)
			);
		}

		if (!pins.length) {
			list.createDiv({
				cls: "word-pins-empty",
				text: this.filter === "current"
					? "No pins in this note yet. Select a word, then use Word Pins: Pin selection (add that command to your Android toolbar)."
					: "No pins yet. Select a word in a long note and pin it.",
			});
			return;
		}

		pins.sort((a, b) => {
			if (a.path !== b.path) return a.path.localeCompare(b.path);
			return (b.created || 0) - (a.created || 0);
		});

		const groups = new Map();
		for (const pin of pins) {
			if (!groups.has(pin.path)) groups.set(pin.path, []);
			groups.get(pin.path).push(pin);
		}

		for (const [path, group] of groups) {
			const title = list.createDiv({ cls: "word-pins-group-title" });
			title.createSpan({ cls: "word-pins-path", text: fileName(path) });
			title.createSpan({ cls: "word-pins-count", text: String(group.length) });
			title.setAttr("title", path);

			for (const pin of group) {
				const card = list.createDiv({ cls: "word-pins-card" });
				const body = card.createDiv({ cls: "word-pins-card-body" });
				body.createDiv({ cls: "word-pins-text", text: pin.text });
				body.createDiv({
					cls: "word-pins-meta",
					text: `Line ${(pin.line || 0) + 1} · ${formatWhen(pin.created)}`,
				});
				card.addEventListener("click", (ev) => {
					if (ev.target.closest(".word-pins-delete")) return;
					this.plugin.jumpToPin(pin);
				});

				const del = card.createEl("button", { cls: "word-pins-delete" });
				del.setAttr("aria-label", "Delete pin");
				setIcon(del, "trash-2");
				del.addEventListener("click", async (ev) => {
					ev.stopPropagation();
					await this.plugin.deletePin(pin.id);
					this.render();
				});
			}
		}
	}
}

class WordPinsSettingTab extends PluginSettingTab {
	constructor(app, plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", { text: "Word Pins" });
		containerEl.createEl("p", {
			text: "Pin words in long notes and jump back later. Works on Android: select text, open the command palette, run Pin selection. You can also add that command to the mobile toolbar.",
		});

		new Setting(containerEl)
			.setName("Delete all pins")
			.setDesc("Removes every pin in every note. This cannot be undone.")
			.addButton((btn) => {
				btn.setButtonText("Delete all")
					.setWarning()
					.onClick(async () => {
						this.plugin.data.pins = [];
						await this.plugin.saveStore();
						this.plugin.refreshViews();
						new Notice("All Word Pins deleted");
					});
			});
	}
}

module.exports = class WordPinsPlugin extends Plugin {
	async onload() {
		this.data = Object.assign({}, DEFAULT_DATA, await this.loadData());
		if (!Array.isArray(this.data.pins)) this.data.pins = [];

		this.registerView(VIEW_TYPE, (leaf) => new WordPinsView(leaf, this));

		this.addRibbonIcon("pin", "Word Pins", () => this.activateView());

		this.addCommand({
			id: "pin-selection",
			name: "Pin selection",
			callback: () => this.pinFromActiveEditor(),
		});

		this.addCommand({
			id: "open-word-pins",
			name: "Open pin list",
			callback: () => this.activateView(),
		});

		this.addCommand({
			id: "jump-latest-in-note",
			name: "Jump to latest pin in this note",
			callback: () => this.jumpToLatestInActiveNote(),
		});

		this.addCommand({
			id: "delete-pins-in-note",
			name: "Delete all pins in this note",
			callback: () => this.deletePinsInActiveNote(),
		});

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor, view) => {
				if (!view || !view.file) return;
				menu.addItem((item) => {
					item.setTitle("Pin word")
						.setIcon("pin")
						.onClick(() => this.pinFromEditor(editor, view.file));
				});
			})
		);

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => this.refreshViews())
		);

		this.registerEvent(
			this.app.vault.on("rename", (file, oldPath) => {
				if (!(file instanceof TFile)) return;
				let changed = false;
				for (const pin of this.data.pins) {
					if (pin.path === oldPath) {
						pin.path = file.path;
						changed = true;
					}
				}
				if (changed) {
					this.saveStore();
					this.refreshViews();
				}
			})
		);

		this.registerEvent(
			this.app.vault.on("delete", (file) => {
				if (!(file instanceof TFile)) return;
				const before = this.data.pins.length;
				this.data.pins = this.data.pins.filter((p) => p.path !== file.path);
				if (this.data.pins.length !== before) {
					this.saveStore();
					this.refreshViews();
				}
			})
		);

		this.addSettingTab(new WordPinsSettingTab(this.app, this));
	}

	onunload() {}

	async saveStore() {
		await this.saveData(this.data);
	}

	refreshViews() {
		this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => {
			if (leaf.view instanceof WordPinsView) leaf.view.render();
		});
	}

	async activateView() {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
		if (!leaf) {
			leaf = workspace.getRightLeaf(false);
			if (!leaf) leaf = workspace.getLeftLeaf(false);
			if (!leaf) leaf = workspace.getLeaf(false);
			await leaf.setViewState({ type: VIEW_TYPE, active: true });
		}
		workspace.revealLeaf(leaf);
		if (leaf.view instanceof WordPinsView) leaf.view.render();
	}

	pinFromActiveEditor() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view || !view.file) {
			new Notice("Open a Markdown note first");
			return;
		}
		this.pinFromEditor(view.editor, view.file);
	}

	jumpToLatestInActiveNote() {
		const file = this.app.workspace.getActiveFile();
		if (!file) {
			new Notice("Open a Markdown note first");
			return;
		}
		const pins = this.data.pins
			.filter((p) => p.path === file.path)
			.sort((a, b) => (b.created || 0) - (a.created || 0));
		if (!pins.length) {
			new Notice("No pins in this note");
			return;
		}
		this.jumpToPin(pins[0]);
	}

	async deletePinsInActiveNote() {
		const file = this.app.workspace.getActiveFile();
		if (!file) {
			new Notice("Open a Markdown note first");
			return;
		}
		const before = this.data.pins.length;
		this.data.pins = this.data.pins.filter((p) => p.path !== file.path);
		await this.saveStore();
		this.refreshViews();
		new Notice(`Deleted ${before - this.data.pins.length} pin(s) in this note`);
	}

	async pinFromEditor(editor, file) {
		if (!file) {
			new Notice("Open a Markdown note first");
			return;
		}
		const hit = wordAtCursor(editor);
		if (!hit) {
			new Notice("Select a word or put the cursor on a word");
			return;
		}
		const pin = {
			id: uid(),
			path: file.path,
			text: hit.text.slice(0, 200),
			line: hit.line,
			ch: hit.ch,
			context: contextAround(editor, hit.line, hit.ch, hit.text),
			created: Date.now(),
		};
		this.data.pins.push(pin);
		await this.saveStore();
		this.refreshViews();
		new Notice(`Pinned “${pin.text}”`);
	}

	async deletePin(id) {
		this.data.pins = this.data.pins.filter((p) => p.id !== id);
		await this.saveStore();
		this.refreshViews();
		new Notice("Pin deleted");
	}

	async jumpToPin(pin) {
		const file = this.app.vault.getAbstractFileByPath(pin.path);
		if (!(file instanceof TFile)) {
			new Notice("That note is missing");
			return;
		}
		const leaf = this.app.workspace.getLeaf(false);
		await leaf.openFile(file);
		const view = leaf.view;
		if (!(view instanceof MarkdownView)) {
			new Notice("Could not open the note in the editor");
			return;
		}
		const content = view.editor.getValue();
		const loc = findPinLocation(content, pin);
		view.editor.setCursor(loc);
		view.editor.scrollIntoView({ from: loc, to: loc }, true);
		view.editor.focus();
		if (loc.line !== pin.line) {
			pin.line = loc.line;
			pin.ch = loc.ch;
			await this.saveStore();
			this.refreshViews();
		}
	}
};
