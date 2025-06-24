// 视图类型枚举
enum ViewType {
  GALLERY = "gallery",
  TABLE = "table"
}

// 当前视图状态
let currentView: ViewType = ViewType.GALLERY;

export function renderGalleryFromJson(source: string, container: HTMLElement) {
  // 清除容器内容
  container.empty();
  
  // 1. 解析 JSON 数据
  let data: Record<string, string>[] = [];
  
  try {
    data = JSON.parse(source);
    if (!Array.isArray(data)) throw new Error("JSON is not an array");
  } catch (e) {
    container.createEl("pre", { text: "⚠️ 无法解析 JSON 数据: " + e.message });
    return;
  }
  
  // 2. 创建视图切换工具栏
  const toolbar = container.createDiv({ cls: "gallery-toolbar" });
  
  // 画廊视图按钮
  const galleryBtn = toolbar.createEl("button", {
    text: "画廊视图",
    cls: currentView === ViewType.GALLERY ? "active" : ""
  });
  
  galleryBtn.onclick = () => {
    currentView = ViewType.GALLERY;
    renderContent();
  };
  
  // 表格视图按钮
  const tableBtn = toolbar.createEl("button", {
    text: "表格视图",
    cls: currentView === ViewType.TABLE ? "active" : ""
  });
  
  tableBtn.onclick = () => {
    currentView = ViewType.TABLE;
    renderContent();
  };
  
  // 3. 创建内容容器
  const contentContainer = container.createDiv({ cls: "gallery-content" });
  
  // 4. 渲染内容函数
  const renderContent = () => {
    // 清除之前的内容
    contentContainer.empty();
    
    // 更新按钮状态
    galleryBtn.classList.toggle("active", currentView === ViewType.GALLERY);
    tableBtn.classList.toggle("active", currentView === ViewType.TABLE);
    
    // 根据当前视图渲染内容
    if (currentView === ViewType.GALLERY) {
      renderGalleryView(data, contentContainer);
    } else {
      renderTableView(data, contentContainer);
    }
  };
  
  // 初始渲染
  renderContent();
}

// 渲染画廊视图
function renderGalleryView(data: Record<string, string>[], container: HTMLElement) {
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
      fieldDiv.createSpan({ cls: "gallery-value", text: value });
    });
  });
}

// 渲染表格视图
function renderTableView(data: Record<string, string>[], container: HTMLElement) {
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
    const th = headerRow.createEl("th", { text: key });
    th.setAttr("data-key", key);
  });
  
  // 创建表格内容
  const tbody = table.createEl("tbody");
  
  data.forEach(item => {
    const row = tbody.createEl("tr");
    
    Array.from(allKeys).forEach(key => {
      const td = row.createEl("td");
      
      if (key === "Avatar" && item[key]) {
        const img = td.createEl("img", { 
          attr: { 
            src: item[key], 
            alt: `Avatar of ${item["Name"] || "unknown"}` 
          } 
        });
        img.classList.add("table-avatar");
      } else {
        td.textContent = item[key] || "-";
      }
    });
  });
}