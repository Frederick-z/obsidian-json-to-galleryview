import { Plugin} from "obsidian";
import { GalleryModal } from "./galleryModal";
import { renderGalleryFromJson } from "./render";
import { GallerySettingTab } from "./settings";
import { GalleryPluginSettings, DEFAULT_SETTINGS } from "./types";

// 使用命名导出而不是默认导出
export default class GalleryJsonPlugin extends Plugin {
  settings: GalleryPluginSettings;

  async onload() {
    console.log("Loading Gallery JSON plugin");
    await this.loadSettings();
    
    // 注册命令（在同一个文件中处理）
    this.addCommand({
      id: "create-gallery-from-json",
      name: "Create Gallery from JSON File",
      callback: async () => {
        new GalleryModal(this.app, this).open();
      }
    });
    
    // 注册代码块处理器
    this.registerMarkdownCodeBlockProcessor(
      "gallery-json", 
      async (source, el, ctx) => {
        renderGalleryFromJson(source, el, ctx, this.settings,this.app);
      }
    );
    
    // 注册设置选项卡
    this.addSettingTab(new GallerySettingTab(this.app, this));
    
    // 添加功能区图标
    this.addRibbonIcon("layout-grid", "Create Gallery from JSON", () => {
      new GalleryModal(this.app, this).open();
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    console.log("Settings loaded:", this.settings);
  }

  async saveSettings() {
    await this.saveData(this.settings);
    console.log("Settings saved");
  }
}