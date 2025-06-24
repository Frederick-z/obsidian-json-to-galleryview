import { App, Modal, TFile, Notice, SuggestModal } from "obsidian";
import  GalleryJsonPlugin  from "./main";
import { DEFAULT_SAMPLE_DATA,GalleryItem } from "./types";

export class GalleryModal extends Modal {
  plugin: GalleryJsonPlugin;
  
  constructor(app: App, plugin: GalleryJsonPlugin) {
    super(app);
    this.plugin = plugin;
  }
  
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "从JSON文件创建画廊" });
    
    // 文件选择器
    const fileSelector = contentEl.createDiv({ cls: "gallery-file-selector" });
    fileSelector.createEl("p", { text: "选择一个JSON文件:" });
    
    // 文件选择按钮
    const fileButton = fileSelector.createEl("button", { 
      text: "浏览文件",
      cls: "gallery-file-btn"
    });
    
    fileButton.onclick = () => {
      new FileSuggestModal(this.app, async (file) => {
        await this.processJsonFile(file);
        this.close();
      }).open();
    };
    
    // 示例数据按钮
    const sampleButton = contentEl.createEl("button", {
      text: "使用示例数据",
      cls: "gallery-sample-btn"
    });
    
    sampleButton.onclick = async () => {
      await this.createGalleryWithSampleData();
      this.close();
    };
  }
  
  async processJsonFile(file: TFile) {
    try {
      const content = await this.app.vault.read(file);
      await this.createGallery(file.basename, content);
      new Notice(`🎨 画廊已从 ${file.name} 创建`);
    } catch (error) {
      new Notice(`⚠️ 创建画廊错误: ${error.message}`);
    }
  }
  
  async createGalleryWithSampleData() {
    try {
      await this.createGallery("示例画廊", JSON.stringify(DEFAULT_SAMPLE_DATA, null, 2));
      new Notice("🎨 使用示例数据创建画廊");
    } catch (error) {
      new Notice(`⚠️ 创建示例画廊错误: ${error.message}`);
    }
  }
  
  async createGallery(title: string, jsonContent: string) {
    const newFileName = `${title.replace(/\s+/g, "-")}-${Date.now()}.md`;
    const galleryContent = this.generateGalleryContent(jsonContent);
    
    try {
      const newFile = await this.app.vault.create(newFileName, galleryContent);
      const leaf = this.app.workspace.getLeaf(true);
      await leaf.openFile(newFile);
    } catch (error) {
      throw new Error("无法创建画廊文件。请检查文件名是否有效");
    }
  }
  
  generateGalleryContent(jsonContent: string): string {
    return `# JSON画廊\n\n\`\`\`gallery-json\n${jsonContent}\n\`\`\``;
  }
}

class FileSuggestModal extends SuggestModal<TFile> {
  onSelect: (file: TFile) => void;
  
  constructor(app: App, onSelect: (file: TFile) => void) {
    super(app);
    this.onSelect = onSelect;
    this.setPlaceholder("搜索JSON文件...");
  }
  
  getSuggestions(query: string): TFile[] {
    return this.app.vault.getFiles().filter(file => 
      file.extension === "json" && 
      file.name.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  renderSuggestion(file: TFile, el: HTMLElement) {
    el.createDiv({ text: file.name, cls: "gallery-suggestion-name" });
    el.createDiv({ text: file.path, cls: "gallery-suggestion-path" });
  }
  
  onChooseSuggestion(file: TFile) {
    this.onSelect(file);
  }
}


