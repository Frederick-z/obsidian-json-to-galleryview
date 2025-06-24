import { App, PluginSettingTab, Setting } from "obsidian";
import  GalleryJsonPlugin  from "./main";
import { GalleryPluginSettings, ViewType, SortDirection } from "./types";

export class GallerySettingTab extends PluginSettingTab {
  plugin: GalleryJsonPlugin;

  constructor(app: App, plugin: GalleryJsonPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async display(): Promise<void> {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Gallery JSON Settings" });
    
    // 默认视图设置
    new Setting(containerEl)
      .setName("Default View")
      .setDesc("Initial view when gallery is loaded")
      .addDropdown(dropdown => 
        dropdown
          .addOption(ViewType.GALLERY, "Gallery View")
          .addOption(ViewType.TABLE, "Table View")
          .setValue(this.plugin.settings.defaultView)
          .onChange(async value => {
            this.plugin.settings.defaultView = value as ViewType;
            await this.plugin.saveSettings();
          })
      );
    
    // 画廊列数设置
    new Setting(containerEl)
      .setName("Gallery Columns")
      .setDesc("Number of columns in gallery view")
      .addSlider(slider => 
        slider
          .setLimits(1, 5, 1)
          .setValue(this.plugin.settings.galleryColumns)
          .setDynamicTooltip()
          .onChange(async value => {
            this.plugin.settings.galleryColumns = value;
            await this.plugin.saveSettings();
          })
      );
    
    // 默认排序字段
    new Setting(containerEl)
      .setName("Default Sort Field")
      .setDesc("Field to sort by default (leave blank for none)")
      .addText(text => 
        text
          .setPlaceholder("e.g., Name")
          .setValue(this.plugin.settings.defaultSortField || "")
          .onChange(async value => {
            this.plugin.settings.defaultSortField = value || null;
            await this.plugin.saveSettings();
          })
      );
    
    // 默认排序方向
    new Setting(containerEl)
      .setName("Default Sort Direction")
      .setDesc("Default sort direction")
      .addDropdown(dropdown => 
        dropdown
          .addOption(SortDirection.ASC, "Ascending (A-Z, 0-9)")
          .addOption(SortDirection.DESC, "Descending (Z-A, 9-0)")
          .setValue(this.plugin.settings.defaultSortDirection)
          .onChange(async value => {
            this.plugin.settings.defaultSortDirection = value as SortDirection;
            await this.plugin.saveSettings();
          })
      );
    
    // 自动刷新设置
    new Setting(containerEl)
      .setName("Auto Refresh")
      .setDesc("Automatically update galleries when files change")
      .addToggle(toggle => 
        toggle
          .setValue(this.plugin.settings.autoRefresh)
          .onChange(async value => {
            this.plugin.settings.autoRefresh = value;
            await this.plugin.saveSettings();
          })
      );
    
    // 缓存外部文件
    new Setting(containerEl)
      .setName("Cache External Files")
      .setDesc("Cache content of external JSON files for faster loading")
      .addToggle(toggle => 
        toggle
          .setValue(this.plugin.settings.cacheExternalFiles)
          .onChange(async value => {
            this.plugin.settings.cacheExternalFiles = value;
            await this.plugin.saveSettings();
          })
      );
  }
}