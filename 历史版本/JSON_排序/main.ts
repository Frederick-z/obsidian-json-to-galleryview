import { Plugin } from "obsidian";
import { renderGalleryFromJson } from "./render";

export default class GalleryJsonPlugin extends Plugin {
  async onload() {
	 // 注册 Markdown 代码块处理器
    this.registerMarkdownCodeBlockProcessor("gallery-json", async (source, el) => {
      renderGalleryFromJson(source, el);
    });
  }
}
