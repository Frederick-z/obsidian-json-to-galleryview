import { App, MarkdownPostProcessorContext, TFile, Notice } from "obsidian";
import { GalleryPluginSettings, GalleryItem, ViewType, SortDirection, SortState } from "./types";
import { GalleryItemForm } from "./galleryAttri";

const allowEdit = true;

export function renderGalleryFromJson(
  source: string,
  container: HTMLElement,
  ctx: MarkdownPostProcessorContext,
  settings: GalleryPluginSettings,
  app: App
) {
  container.empty();

  let data: GalleryItem[] = [];

  try {
    data = JSON.parse(source);
    if (!Array.isArray(data)) throw new Error("不是数组");
  } catch (e) {
    data = [];
  }

  const state = {
    viewType: settings.defaultView,
    sort: {
      field: settings.defaultSortField,
      direction: settings.defaultSortDirection,
    },
  };

  renderToolbarAndContent(data, container, state, settings, app, source, ctx);
}

function renderToolbarAndContent(
  data: GalleryItem[],
  container: HTMLElement,
  state: { viewType: ViewType; sort: SortState },
  settings: GalleryPluginSettings,
  app: App,
  source: string,
  ctx: MarkdownPostProcessorContext
) {
  const toolbar = container.createDiv({ cls: "gallery-toolbar" });
  const contentContainer = container.createDiv({ cls: "gallery-content" });

  const rerender = () => {
    contentContainer.empty();
    if (state.viewType === ViewType.GALLERY) {
      renderGalleryView(data, contentContainer, settings, app, source, ctx, container);
    } else {
      renderTableView(data, contentContainer, state.sort);
    }
  };

  renderViewSwitcher(toolbar, state, rerender);
  rerender();
}

function renderViewSwitcher(
  toolbar: HTMLElement,
  state: { viewType: ViewType },
  callback: () => void
) {
  const viewGroup = toolbar.createDiv({ cls: "toolbar-group" });

  const galleryBtn = viewGroup.createEl("button", { text: "画廊视图" });
  const tableBtn = viewGroup.createEl("button", { text: "表格视图" });

  galleryBtn.onclick = () => {
    state.viewType = ViewType.GALLERY;
    callback();
  };
  tableBtn.onclick = () => {
    state.viewType = ViewType.TABLE;
    callback();
  };
}

function renderGalleryView(
  data: GalleryItem[],
  container: HTMLElement,
  settings: GalleryPluginSettings,
  app: App,
  source: string,
  ctx: MarkdownPostProcessorContext,
  rootContainer: HTMLElement
) {
  const wrapper = container.createDiv({ cls: "gallery-grid" });

  data.forEach((item, index) => {
    const card = wrapper.createDiv({ cls: "gallery-card" });

    card.onclick = (e) => {
      e.stopPropagation();
      openEditModal(index, data, wrapper, settings, app, source, ctx, rootContainer);
    };

    const imgUrl = item["Avatar"];
    if (imgUrl && typeof imgUrl === "string") {
      const img = card.createEl("img", { attr: { src: imgUrl } });
      img.classList.add("gallery-avatar");
    }

    Object.entries(item).forEach(([key, value]) => {
      if (key === "Avatar") return;
      card.createEl("div", { text: `${key}: ${value}`, cls: "gallery-field" });
    });

    const editBtn = card.createEl("button", {
      cls: "edit-button",
      text: "Edit"
    });
    editBtn.onclick = (e) => {
      e.stopPropagation();
      openEditModal(index, data, wrapper, settings, app, source, ctx, rootContainer);
    };
  });

  if (allowEdit) {
    const addCard = wrapper.createDiv({ cls: "gallery-card gallery-add-card" });
    addCard.createDiv({ cls: "add-icon", text: "+" });
    addCard.createDiv({ cls: "add-text", text: "New page" });
    addCard.onclick = () => {
      openAddModal(data, wrapper, settings, app, source, ctx, rootContainer);
    };
  }
}

async function updateCodeBlock(
  originalSource: string,
  newData: GalleryItem[],
  ctx: MarkdownPostProcessorContext,
  app: App,
  containerEl: HTMLElement
) {
  try {
    const filePath = ctx.sourcePath;
    const file = app.vault.getAbstractFileByPath(filePath);
    if (!(file instanceof TFile)) {
      new Notice("无法更新画廊数据：文件未找到");
      return;
    }
    
    const content = await app.vault.read(file);
    
    // 修正：使用传入的容器元素获取代码块位置
    const sectionInfo = ctx.getSectionInfo(containerEl);
    
    if (!sectionInfo) {
      new Notice("无法更新画廊数据：无法获取代码块位置");
      return;
    }
    
    const newJson = JSON.stringify(newData, null, 2);
    const newBlock = `\`\`\`gallery-json\n${newJson}\n\`\`\``;
    
    const lines = content.split('\n');
    const beforeLines = lines.slice(0, sectionInfo.lineStart);
    const afterLines = lines.slice(sectionInfo.lineEnd + 1);
    const newContent = [...beforeLines, newBlock, ...afterLines].join('\n');
    
    await app.vault.modify(file, newContent);
    new Notice("画廊数据已保存");
  } catch (error) {
    console.error("更新代码块失败", error);
    new Notice(`更新画廊数据失败: ${error.message}`);
  }
}

function openAddModal(
  data: GalleryItem[],
  wrapper: HTMLElement,
  settings: GalleryPluginSettings,
  app: App,
  source: string,
  ctx: MarkdownPostProcessorContext,
  containerEl: HTMLElement
) {
  const onAddItem = async (newItem: GalleryItem) => {
    data.push(newItem);
    renderGalleryView(data, wrapper, settings, app, source, ctx, containerEl);
    await updateCodeBlock(source, data, ctx, app, containerEl);
  };
  
  new GalleryItemForm(app, onAddItem).open();
}

function openEditModal(
  index: number,
  data: GalleryItem[],
  wrapper: HTMLElement,
  settings: GalleryPluginSettings,
  app: App,
  source: string,
  ctx: MarkdownPostProcessorContext,
  containerEl: HTMLElement
) {
  const onEditItem = async (editedItem: GalleryItem) => {
    data[index] = editedItem;
    renderGalleryView(data, wrapper, settings, app, source, ctx, containerEl);
    await updateCodeBlock(source, data, ctx, app, containerEl);
  };
  
  new GalleryItemForm(app, onEditItem, data[index]).open();
}

function renderTableView(data: GalleryItem[], container: HTMLElement, sort: SortState) {
  const table = container.createEl("table", { cls: "gallery-table" });
  const thead = table.createEl("thead");
  const tbody = table.createEl("tbody");

  if (data.length === 0) {
    tbody.createEl("tr").createEl("td", { text: "无数据" });
    return;
  }

  const keys = Object.keys(data[0]);

  const headRow = thead.createEl("tr");
  keys.forEach(key => {
    headRow.createEl("th", { text: key });
  });

  data.forEach(item => {
    const row = tbody.createEl("tr");
    keys.forEach(key => {
      row.createEl("td", { text: item[key] ?? "" });
    });
  });
}