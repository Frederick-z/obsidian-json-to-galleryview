import { MarkdownPostProcessorContext, TFile, Notice,App } from "obsidian"; // 添加 TFile 导入
import { GalleryPluginSettings, GalleryItem, ViewType, SortDirection, SortState } from "./types";

// 主渲染函数
export function renderGalleryFromJson(
  source: string, 
  container: HTMLElement, 
  ctx: MarkdownPostProcessorContext,
  settings: GalleryPluginSettings,
  app: App // ✅ 传入 Obsidian 的全局 app 对象
) {
  container.empty();
  
  // 检查是否是外部文件引用
  if (source.trim().startsWith("file:")) {
    const filePath = source.trim().substring(5).trim();
    loadAndRenderExternalJson(filePath, container, ctx, settings,app);
    return;
  }
  
  try {
    const data = parseJsonSource(source);
    const state = createInitialState(settings);
    renderToolbarAndContent(data, container, state, settings);
  } catch (e) {
    container.createEl("pre", { 
      text: `⚠️ 无法渲染数据: ${e.message}`,
      cls: "gallery-error"
    });
  }
}

// 解析JSON源数据
function parseJsonSource(source: string): GalleryItem[] {
  try {
    const data = JSON.parse(source);
    
    if (!Array.isArray(data)) {
      throw new Error("JSON必须是一个对象数组");
    }
    
    return data;
  } catch (e) {
    throw new Error(`无效的JSON: ${e.message}`);
  }
}

// 创建初始状态
function createInitialState(settings: GalleryPluginSettings) {
  return {
    viewType: settings.defaultView,
    sort: {
      field: settings.defaultSortField,
      direction: settings.defaultSortDirection
    }
  };
}

// 渲染工具栏和内容
function renderToolbarAndContent(
  data: GalleryItem[],
  container: HTMLElement,
  state: { viewType: ViewType; sort: SortState },
  settings: GalleryPluginSettings
) {
  // 渲染工具栏
  const toolbar = container.createDiv({ cls: "gallery-toolbar" });
  
  // 修复：使用闭包解决 render 函数作用域问题
  let renderContent: () => void;
  
  renderViewSwitcher(toolbar, state, () => renderContent());
  renderSortControls(toolbar, data, state, () => renderContent());
  
  // 创建内容容器
  const contentContainer = container.createDiv({ cls: "gallery-content" });
  
  // 定义实际的渲染函数
  renderContent = () => {
    contentContainer.empty();
    const sortedData = applySorting([...data], state.sort.field, state.sort.direction);
    
    if (state.viewType === ViewType.GALLERY) {
      renderGalleryView(sortedData, contentContainer, settings);
    } else {
      renderTableView(sortedData, contentContainer, state.sort);
    }
  };
  
  // 初始渲染
  renderContent();
}

// 应用排序
function applySorting(
  data: GalleryItem[],
  field: string | null,
  direction: SortDirection
): GalleryItem[] {
  if (!field || field.trim() === "") return [...data];
  
  return [...data].sort((a, b) => {
    const aValue = a[field];
    const bValue = b[field];
    
    // 处理空值
    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;
    
    // 处理数字
    if (typeof aValue === "number" && typeof bValue === "number") {
      return direction === SortDirection.ASC ? aValue - bValue : bValue - aValue;
    }
    
    // 处理日期
    if (aValue instanceof Date && bValue instanceof Date) {
      return direction === SortDirection.ASC 
        ? aValue.getTime() - bValue.getTime() 
        : bValue.getTime() - aValue.getTime();
    }
    
    // 尝试转换为日期
    const aDate = tryParseDate(aValue);
    const bDate = tryParseDate(bValue);
    
    if (aDate && bDate) {
      return direction === SortDirection.ASC 
        ? aDate.getTime() - bDate.getTime() 
        : bDate.getTime() - aDate.getTime();
    }
    
    // 默认字符串比较
    const aStr = String(aValue);
    const bStr = String(bValue);
    
    return direction === SortDirection.ASC 
      ? aStr.localeCompare(bStr) 
      : bStr.localeCompare(aStr);
  });
}

// 尝试解析为日期
function tryParseDate(value: any): Date | null {
  if (value instanceof Date) return value;
  
  if (typeof value === "number") {
    return new Date(value);
  }
  
  if (typeof value === "string") {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  
  return null;
}

// 渲染视图切换器
function renderViewSwitcher(
  toolbar: HTMLElement, 
  state: { viewType: ViewType },
  renderCallback: () => void // 添加回调参数
) {
  const viewGroup = toolbar.createDiv({ cls: "toolbar-group" });
  
  const galleryBtn = viewGroup.createEl("button", {
    text: "画廊视图",
    cls: state.viewType === ViewType.GALLERY ? "active" : ""
  });
  
  galleryBtn.onclick = () => {
    state.viewType = ViewType.GALLERY;
    renderCallback();
  };
  
  const tableBtn = viewGroup.createEl("button", {
    text: "表格视图",
    cls: state.viewType === ViewType.TABLE ? "active" : ""
  });
  
  tableBtn.onclick = () => {
    state.viewType = ViewType.TABLE;
    renderCallback();
  };
}

// 渲染排序控件
function renderSortControls(
  toolbar: HTMLElement, 
  data: GalleryItem[],
  state: { sort: SortState },
  renderCallback: () => void // 添加回调参数
) {
  const sortGroup = toolbar.createDiv({ cls: "toolbar-group" });
  
  // 排序字段选择
  const sortFieldSelect = sortGroup.createEl("select", { cls: "sort-select" });
  
  // 获取所有可能的字段
  const allFields = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => allFields.add(key));
  });
  
  // 添加空选项
  const defaultOption = sortFieldSelect.createEl("option", {
    value: "",
    text: "默认排序"
  });
  
  // 添加字段选项
  allFields.forEach(field => {
    const option = sortFieldSelect.createEl("option", {
      value: field,
      text: field
    });
    
    // 修复：使用 setAttr 替代直接 selected 属性
    if (state.sort.field === field) {
      option.setAttr("selected", "selected");
    }
  });
  
  sortFieldSelect.onchange = () => {
    state.sort.field = sortFieldSelect.value || null;
    renderCallback();
  };
  
  // 排序方向按钮
  const sortDirBtn = sortGroup.createEl("button", {
    cls: "sort-direction",
    text: state.sort.direction === SortDirection.ASC ? "↑" : "↓"
  });
  
  sortDirBtn.onclick = () => {
    state.sort.direction = state.sort.direction === SortDirection.ASC 
      ? SortDirection.DESC 
      : SortDirection.ASC;
    renderCallback();
  };
}

// 渲染画廊视图
function renderGalleryView(
  data: GalleryItem[], 
  container: HTMLElement, 
  settings: GalleryPluginSettings
) {
  // 根据设置创建网格布局
  const columns = settings.galleryColumns;
  const wrapper = container.createDiv({ 
    cls: "gallery-grid",
    attr: { 
      style: `--gallery-columns: ${columns};`  // 使用 CSS 变量
    }
  });

  data.forEach((item) => {
    const card = wrapper.createDiv({ cls: "gallery-card" });

    // 头像处理
    const imgUrl = item["Avatar"];
    if (imgUrl && typeof imgUrl === "string") {
      const img = card.createEl("img", { attr: { src: imgUrl } });
      img.classList.add("gallery-avatar");
    }

    // 其他字段处理
    Object.entries(item).forEach(([key, value]) => {
      if (key === "Avatar") return;
      
      const fieldDiv = card.createDiv({ cls: "gallery-field" });
      fieldDiv.createSpan({ cls: "gallery-key", text: `${key}: ` });
      
      if (value instanceof Date) {
        fieldDiv.createSpan({ 
          cls: "gallery-value", 
          text: value.toLocaleDateString() 
        });
      } else if (typeof value === "string" && value.startsWith("http")) {
        const link = fieldDiv.createEl("a", { 
          text: value, 
          attr: { href: value, target: "_blank" } 
        });
        link.classList.add("gallery-link");
      } else {
        fieldDiv.createSpan({ cls: "gallery-value", text: String(value) });
      }
    });
  });
}

// 渲染表格视图
function renderTableView(
  data: GalleryItem[], 
  container: HTMLElement,
  sortState: SortState
) {
  if (data.length === 0) {
    container.createEl("div", { text: "没有数据可显示", cls: "no-data" });
    return;
  }
  
  const allKeys = new Set<string>();
  data.forEach(item => Object.keys(item).forEach(key => allKeys.add(key)));
  
  const tableContainer = container.createDiv({ cls: "table-container" });
  const table = tableContainer.createEl("table", { cls: "gallery-table" });
  
  const thead = table.createEl("thead");
  const headerRow = thead.createEl("tr");
  
  Array.from(allKeys).forEach(key => {
    const th = headerRow.createEl("th", { 
      text: key,
      cls: sortState.field === key ? "sorted" : ""
    });
    
    if (sortState.field === key) {
      th.createSpan({
        cls: "sort-indicator",
        text: sortState.direction === SortDirection.ASC ? " ↑" : " ↓"
      });
    }
    
    th.onclick = () => {
      if (sortState.field === key) {
        sortState.direction = sortState.direction === SortDirection.ASC 
          ? SortDirection.DESC 
          : SortDirection.ASC;
      } else {
        sortState.field = key;
        sortState.direction = SortDirection.ASC;
      }
      
      // 重新渲染表格
      renderTableView(data, container, sortState);
    };
  });
  
  const tbody = table.createEl("tbody");
  const sortedData = applySorting([...data], sortState.field, sortState.direction);
  
  sortedData.forEach(item => {
    const row = tbody.createEl("tr");
    
    Array.from(allKeys).forEach(key => {
      const td = row.createEl("td");
      const value = item[key];
      
      if (key === "Avatar" && value && typeof value === "string") {
        const img = td.createEl("img", { 
          attr: { 
            src: value, 
            alt: `Avatar of ${item["Name"] || "unknown"}` 
          } 
        });
        img.classList.add("table-avatar");
      } else if (value instanceof Date) {
        td.textContent = value.toLocaleDateString();
      } else if (typeof value === "string" && value.startsWith("http")) {
        const link = td.createEl("a", { 
          text: value, 
          attr: { href: value, target: "_blank" } 
        });
        link.classList.add("table-link");
      } else {
        td.textContent = value !== undefined ? String(value) : "-";
      }
    });
  });
}

// 加载和渲染外部JSON
async function loadAndRenderExternalJson(
  filePath: string, 
  container: HTMLElement, 
  ctx: MarkdownPostProcessorContext,
  settings: GalleryPluginSettings,
  app:App
) {
  try {
    container.empty();
    const loading = container.createDiv({ cls: "gallery-loading" });
    loading.createEl("div", { cls: "loading-spinner" });
    loading.createEl("p", { text: "加载JSON数据..." });
    
    // 获取文件
    const file = app.vault.getAbstractFileByPath(filePath);
    if (!file || !(file instanceof TFile)) {
      throw new Error(`文件未找到: ${filePath}`);
    }
    
    // 读取文件内容
    const content = await app.vault.read(file);
    
    // 解析JSON
    let data: GalleryItem[];
    try {
      data = JSON.parse(content);
      if (!Array.isArray(data)) throw new Error("JSON不是一个数组");
    } catch (e) {
      throw new Error(`无效的JSON格式: ${e.message}`);
    }
    
    // 渲染画廊
    const state = createInitialState(settings);
    renderToolbarAndContent(data, container, state, settings);
    
    // 添加文件信息
    const fileInfo = container.createDiv({ cls: "gallery-file-info" });
    fileInfo.createSpan({ text: "来源: " });
    fileInfo.createEl("a", {
      text: filePath,
      attr: { 
        "data-href": filePath,
        "class": "internal-link"
      }
    }).onclick = (evt) => {
      evt.preventDefault();
      app.workspace.openLinkText(filePath, "", true);
    };
    
  } catch (error) {
    container.empty();
    container.createEl("pre", { 
      cls: "gallery-error",
      text: `⚠️ 加载外部JSON错误: ${error.message}`
    });
  }
}