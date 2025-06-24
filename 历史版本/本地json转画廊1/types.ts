import { Notice } from "obsidian";

// 视图类型
export enum ViewType {
  GALLERY = "gallery",
  TABLE = "table"
}

// 排序方向
export enum SortDirection {
  ASC = "asc",
  DESC = "desc"
}

// 排序状态
export interface SortState {
  field: string | null;
  direction: SortDirection;
}

// 插件设置
export interface GalleryPluginSettings {
  defaultView: ViewType;
  galleryColumns: number;
  autoRefresh: boolean;
  cacheExternalFiles: boolean;
  defaultSortField: string | null;
  defaultSortDirection: SortDirection;
}

// 默认设置
export const DEFAULT_SETTINGS: GalleryPluginSettings = {
  defaultView: ViewType.GALLERY,
  galleryColumns: 3,
  autoRefresh: true,
  cacheExternalFiles: true,
  defaultSortField: null,
  defaultSortDirection: SortDirection.ASC
};

// 示例数据
export const DEFAULT_SAMPLE_DATA = [
  {
    "Avatar": "https://randomuser.me/api/portraits/women/68.jpg",
    "Name": "Alice",
    "Age": 28,
    "Job": "Engineer"
  },
  {
    "Avatar": "https://randomuser.me/api/portraits/men/45.jpg",
    "Name": "Bob",
    "Age": 35,
    "Job": "Designer"
  }
];

// 修复：添加 GalleryItem 类型导出
export type GalleryItem = Record<string, any>;