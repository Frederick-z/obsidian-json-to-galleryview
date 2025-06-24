export function renderGalleryFromJson(source: string, container: HTMLElement) {
  let data: Record<string, string>[] = [];

  try {
    data = JSON.parse(source);
    if (!Array.isArray(data)) throw new Error("JSON is not an array");
  } catch (e) {
    container.createEl("pre", { text: "⚠️ 无法解析 JSON 数据: " + e.message });
    return;
  }

  const wrapper = container.createDiv({ cls: "gallery-grid" });

  data.forEach((item) => {
    const card = wrapper.createDiv({ cls: "gallery-card" });

    const imgUrl = item["Avatar"];
    if (imgUrl && typeof imgUrl === "string") {
      const img = card.createEl("img", { attr: { src: imgUrl } });
      img.classList.add("gallery-avatar");
    }

    Object.entries(item).forEach(([key, value]) => {
      if (key === "Avatar") return;
      card.createEl("div", { text: `${key}: ${value}` });
    });
  });
}
