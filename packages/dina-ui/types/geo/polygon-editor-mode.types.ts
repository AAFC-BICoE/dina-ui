export const POLYGON_EDITOR_MODE = {
  VIEW: "view",
  EDIT: "edit"
} as const;

export type PolygonEditorMode =
  (typeof POLYGON_EDITOR_MODE)[keyof typeof POLYGON_EDITOR_MODE];
