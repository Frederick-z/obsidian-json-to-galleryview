import { Plugin } from "obsidian";

// 视图类型枚举
enum ViewType {
  GALLERY = "gallery",
  TABLE = "table"
}

// 排序方向枚举
enum SortDirection {
  ASC = "asc",
  DESC = "desc"
}

// 插件状态管理
interface PluginState {
  currentView: ViewType;
  sortField: string | null;
  sortDirection: SortDirection;
}

export function renderGalleryFromJson(source: string, container: HTMLElement) {
  // 清除容器内容
  container.empty();
  
  // 1. 解析 JSON 数据
  let data: Record<string, any>[] = [];
  
  try {
    data = JSON.parse(source);
    if (!Array.isArray(data)) throw new Error("JSON is not an array");
  } catch (e) {
    container.createEl("pre", { text: "⚠️ 无法解析 JSON 数据: " + e.message });
    return;
  }
  
  // 初始化状态
  const state: PluginState = {
    currentView: ViewType.GALLERY,
    sortField: null,
    sortDirection: SortDirection.ASC
  };
  
  // 2. 创建工具栏
  const toolbar = container.createDiv({ cls: "gallery-toolbar" });
  
  // 视图切换按钮
  const viewGroup = toolbar.createDiv({ cls: "toolbar-group" });
  
  const galleryBtn = viewGroup.createEl("button", {
    text: "画廊视图",
    cls: state.currentView === ViewType.GALLERY ? "active" : ""
  });
  
  galleryBtn.onclick = () => {
    state.currentView = ViewType.GALLERY;
    renderContent();
  };
  
  const tableBtn = viewGroup.createEl("button", {
    text: "表格视图",
    cls: state.currentView === ViewType.TABLE ? "active" : ""
  });
  
  tableBtn.onclick = () => {
    state.currentView = ViewType.TABLE;
    renderContent();
  };
  
  // 排序控制组
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
  });
  
  sortFieldSelect.onchange = () => {
    state.sortField = sortFieldSelect.value || null;
    renderContent();
  };
  
  // 排序方向按钮
  const sortDirBtn = sortGroup.createEl("button", {
    cls: "sort-direction",
    text: state.sortDirection === SortDirection.ASC ? "↑" : "↓"
  });
  
  sortDirBtn.onclick = () => {
    state.sortDirection = state.sortDirection === SortDirection.ASC 
      ? SortDirection.DESC 
      : SortDirection.ASC;
    renderContent();
  };
  
  // 3. 创建内容容器
  const contentContainer = container.createDiv({ cls: "gallery-content" });
  
  // 4. 渲染内容函数
  const renderContent = () => {
    // 清除之前的内容
    contentContainer.empty();
    
    // 更新按钮状态
    galleryBtn.classList.toggle("active", state.currentView === ViewType.GALLERY);
    tableBtn.classList.toggle("active", state.currentView === ViewType.TABLE);
    sortDirBtn.textContent = state.sortDirection === SortDirection.ASC ? "↑" : "↓";
    
    // 应用排序
    const sortedData = applySorting([...data], state.sortField, state.sortDirection);
    
    // 根据当前视图渲染内容
    if (state.currentView === ViewType.GALLERY) {
      renderGalleryView(sortedData, contentContainer);
    } else {
      renderTableView(sortedData, contentContainer, state.sortField, state.sortDirection);
    }
  };
  
  // 初始渲染
  renderContent();
}

// 应用排序
function applySorting(data: Record<string, any>[], field: string | null, direction: SortDirection) {
  if (!field) return [...data];
  
  return [...data].sort((a, b) => {
    const aValue = a[field];
    const bValue = b[field];
    
    // 处理不同类型值的比较
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return direction === SortDirection.ASC ? aValue - bValue : bValue - aValue;
    }
    
    if (aValue instanceof Date && bValue instanceof Date) {
      return direction === SortDirection.ASC 
        ? aValue.getTime() - bValue.getTime() 
        : bValue.getTime() - aValue.getTime();
    }
    
    // 默认字符串比较
    const aStr = String(aValue || "");
    const bStr = String(bValue || "");
    
    return direction === SortDirection.ASC 
      ? aStr.localeCompare(bStr) 
      : bStr.localeCompare(aStr);
  });
}

// 渲染画廊视图
function renderGalleryView(data: Record<string, any>[], container: HTMLElement) {
  const wrapper = container.createDiv({ cls: "gallery-grid" });

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
      
      // 特殊处理日期和链接
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
  data: Record<string, any>[], 
  container: HTMLElement,
  sortField: string | null,
  sortDirection: SortDirection
) {
  if (data.length === 0) {
    container.createEl("div", { text: "没有数据可显示", cls: "no-data" });
    return;
  }
  
  // 获取所有字段名
  const allKeys = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });
  
  // 创建表格容器
  const tableContainer = container.createDiv({ cls: "table-container" });
  const table = tableContainer.createEl("table", { cls: "gallery-table" });
  
  // 创建表头
  const thead = table.createEl("thead");
  const headerRow = thead.createEl("tr");
  
  Array.from(allKeys).forEach(key => {
    const th = headerRow.createEl("th", { 
      text: key,
      cls: sortField === key ? "sorted" : ""
    });
    
    // 添加排序指示器
    if (sortField === key) {
      const dirIndicator = th.createSpan({
        cls: "sort-indicator",
        text: sortDirection === SortDirection.ASC ? " ↑" : " ↓"
      });
    }
    
    // 点击表头排序
    th.onclick = () => {
      // 如果已经是当前排序字段，则切换方向
      if (sortField === key) {
        sortDirection = sortDirection === SortDirection.ASC 
          ? SortDirection.DESC 
          : SortDirection.ASC;
      } else {
        // 否则设置为新字段，默认升序
        sortField = key;
        sortDirection = SortDirection.ASC;
      }
      
      // 重新渲染表格
      renderTableView(data, container, sortField, sortDirection);
    };
  });
  
  // 创建表格内容
  const tbody = table.createEl("tbody");
  
  data.forEach(item => {
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