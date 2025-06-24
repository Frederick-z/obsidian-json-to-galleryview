import { Plugin } from "obsidian";
import { VIEW_TYPE_TABLE_GALLERY, TableGalleryView } from "./tableGalleryView";

export default class TableGalleryPlugin extends Plugin {
  async onload() {
    this.registerView(VIEW_TYPE_TABLE_GALLERY, (leaf) => new TableGalleryView(leaf, this));

    this.addCommand({
      id: "open-table-gallery-view",
      name: "Render Table as Gallery",
      callback: async () => {
        const leaf = this.app.workspace.getRightLeaf(false);
        if (!leaf) return;

        await leaf.setViewState({
          type: VIEW_TYPE_TABLE_GALLERY,
          active: true,
        });
        this.app.workspace.revealLeaf(leaf);
      },
    });
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_TABLE_GALLERY);
  }
}
