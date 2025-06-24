import { ItemView, WorkspaceLeaf, TFile, Plugin } from "obsidian";

export const VIEW_TYPE_TABLE_GALLERY = "table-gallery-view";

export class TableGalleryView extends ItemView {
  plugin: Plugin;
  data: Record<string, string>[] = [];
  currentView: "gallery" | "list" = "gallery";

  constructor(leaf: WorkspaceLeaf, plugin: Plugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return VIEW_TYPE_TABLE_GALLERY;
  }

  getDisplayText() {
    return "Table Gallery View";
  }

  getIcon() {
    return "table";
  }

  async onOpen() {
    await this.loadDataFromEditor();
    this.render();
  }

  async loadDataFromEditor() {
    const editor = this.app.workspace.activeEditor?.editor;
    if (!editor) return;

    const content = editor.getSelection() || editor.getValue();
    const tableRegex = /\|(.+?)\|\s*\n\|[-| :]+\|\s*\n((?:\|.*\|\s*\n?)*)/;
    const match = content.match(tableRegex);

    if (!match) return;

    const headerLine = match[1].split("|").map(s => s.trim());
    const bodyLines = match[2].split("\n").filter(line => line.startsWith("|"));

    this.data = bodyLines.map((line) => {
      const cells = line.split("|").map(s => s.trim());
      const row: Record<string, string> = {};
      headerLine.forEach((h, i) => {
        row[h] = cells[i + 1] ?? "";
      });
      return row;
    });
  }

  render() {
    this.containerEl.empty();

    const toolbar = this.containerEl.createDiv({ cls: "tg-toolbar" });
    const galleryBtn = toolbar.createEl("button", { text: "Gallery View" });
    const listBtn = toolbar.createEl("button", { text: "List View" });

    galleryBtn.onclick = () => {
      this.currentView = "gallery";
      this.render();
    };
    listBtn.onclick = () => {
      this.currentView = "list";
      this.render();
    };

    const content = this.containerEl.createDiv({ cls: "tg-content" });

    if (this.currentView === "gallery") {
      this.renderGallery(content);
    } else {
      this.renderList(content);
    }
  }

  extractImageUrl(markdown: string): string {
    const match = markdown.match(/!\[.*?\]\((.*?)\)/);
    return match?.[1] ?? "";
  }

  renderGallery(container: HTMLElement) {
    container.addClass("tg-gallery");

    this.data.forEach((item) => {
      const card = container.createDiv({ cls: "tg-card" });

      const avatarUrl = this.extractImageUrl(item["Avatar"]);
      if (avatarUrl) {
        const img = card.createEl("img", { attr: { src: avatarUrl, alt: item["Name"] } });
        img.addClass("tg-avatar");
      }

      Object.entries(item).forEach(([key, val]) => {
        if (key === "Avatar") return;
        card.createEl("div", { text: `${key}: ${val}` });
      });
    });
  }

  renderList(container: HTMLElement) {
    const table = container.createEl("table", { cls: "tg-table" });
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");

    if (this.data.length === 0) return;

    const keys = Object.keys(this.data[0]);
    keys.forEach((key) => headerRow.createEl("th", { text: key }));

    const tbody = table.createEl("tbody");
    this.data.forEach((item) => {
      const row = tbody.createEl("tr");
      keys.forEach((key) => {
        if (key === "Avatar") {
          const td = row.createEl("td");
          const img = td.createEl("img", { attr: { src: this.extractImageUrl(item[key]), alt: "avatar" } });
          img.addClass("tg-avatar-sm");
        } else {
          row.createEl("td", { text: item[key] });
        }
      });
    });
  }
}
