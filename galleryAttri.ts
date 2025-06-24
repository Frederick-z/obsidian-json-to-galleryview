import { App, Modal, TFile, Notice, SuggestModal } from "obsidian";
import GalleryJsonPlugin from "./main";
import { DEFAULT_SAMPLE_DATA, GalleryItem } from "./types";

export class GalleryItemForm extends Modal {
  onSubmit: (item: GalleryItem) => void;
  initialItem: GalleryItem;
  
  constructor(
    app: App,
    onSubmit: (item: GalleryItem) => void,
    initialItem?: GalleryItem,
  ) {
    super(app);
    this.onSubmit = onSubmit;
    this.initialItem = initialItem || {};
  }
  
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    
    const title = Object.keys(this.initialItem).length ? "Edit Item" : "Add New Item";
    contentEl.createEl("h2", { text: title, cls: "form-title" });
    
    // 创建属性表格容器
    const propertiesTable = contentEl.createDiv({ cls: "properties-container" });
    
    // 预定义的属性列表（带图标）
    const predefinedProperties = [
      { key: "Type", icon: "type-icon" },
      { key: "Fields", icon: "fields-icon" },
      { key: "Level", icon: "level-icon" },
      { key: "Source", icon: "source-icon" },
      { key: "Cover", icon: "cover-icon" },
      { key: "Home", icon: "home-icon" },
      { key: "Date", icon: "date-icon" }
    ];
    
    // 如果存在初始项，使用初始项的属性
    if (Object.keys(this.initialItem).length > 0) {
      // 编辑模式：显示实际属性
      for (const key in this.initialItem) {
        if (this.initialItem.hasOwnProperty(key)) {
          const value = this.initialItem[key];
          
          // 查找预定义属性中是否有匹配的图标
          const predefinedProp = predefinedProperties.find(p => p.key === key);
          const iconClass = predefinedProp ? predefinedProp.icon : "";
          
          this.addPropertyRow(
            propertiesTable,
            key,
            iconClass,
            value
          );
        }
      }
    } else {
      // 新建模式：显示预定义属性
      predefinedProperties.forEach(prop => {
        this.addPropertyRow(
          propertiesTable,
          prop.key,
          prop.icon,
          ""
        );
      });
    }
    
    // 添加自定义属性按钮
    const addPropButton = contentEl.createEl("button", {
      cls: "add-property",
      text: "+ Add a property"
    });
    addPropButton.onclick = () => this.addPropertyRow(propertiesTable);
    
    // 按钮容器
    const buttonContainer = contentEl.createDiv({ cls: "button-container" });
    
    // 取消按钮
    const cancelButton = buttonContainer.createEl("button", {
      cls: "cancel-button",
      text: "Cancel"
    });
    cancelButton.onclick = () => this.close();
    
    // 保存按钮
    const saveButton = buttonContainer.createEl("button", {
      cls: "save-button",
      text: "Save"
    });
    saveButton.onclick = () => this.saveItem(propertiesTable);
  }
  
  addPropertyRow(
    container: HTMLElement,
    keyPreset: string = "",
    iconClass: string = "",
    valuePreset: string = ""
  ) {
    const row = container.createDiv({ cls: "property-row" });
    
    // 左侧属性单元格
    const propertyCell = row.createDiv({ cls: "property-cell" });
    
    if (iconClass) {
      // 添加属性图标
      const icon = propertyCell.createSpan({ cls: `property-icon ${iconClass}` });
      icon.setAttr("title", keyPreset);
    }
    
    const keyInput = propertyCell.createEl("input", {
      type: "text",
      placeholder: "Property name",
      value: keyPreset,
      cls: "property-name"
    });
    
    // 右侧值单元格
    const valueCell = row.createDiv({ cls: "value-cell" });
    
    // 处理日期类型的特殊输入
    if (keyPreset.toLowerCase() === "date") {
      const dateInput = valueCell.createEl("input", {
        type: "date",
        value: valuePreset === "Empty" ? "" : valuePreset,
        cls: "date-picker"
      });
    } else {
      const valueInput = valueCell.createEl("input", {
        type: "text",
        placeholder: "Value",
        value: valuePreset === "Empty" ? "" : valuePreset,
        cls: "property-value"
      });
    }
    
    // 添加删除按钮
    const deleteButton = row.createEl("button", {
      cls: "delete-property",
      text: "×"
    });
    deleteButton.onclick = () => {
      row.remove();
    };
  }
  
  saveItem(container: HTMLElement) {
    const rows = container.querySelectorAll(".property-row");
    const item: GalleryItem = {};
    let hasData = false;
    
    rows.forEach(row => {
      const keyInput = row.querySelector(".property-name") as HTMLInputElement;
      const valueInput = row.querySelector(".property-value, .date-picker") as HTMLInputElement;
      
      if (keyInput && valueInput) {
        const key = keyInput.value.trim();
        const value = valueInput.value.trim();
        
        if (key && value) {
          item[key] = value;
          hasData = true;
        }
      }
    });
    
    if (hasData) {
      this.onSubmit(item);
      this.close();
      new Notice("Item saved successfully");
    } else {
      new Notice("Please fill at least one property");
    }
  }
  
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}