import { h, type VNode } from "vue";

type IconOptions = {
  size?: number;
  stroke?: boolean;
};

export function renderPathIcon(path: string, options: IconOptions = {}): VNode {
  const size = options.size ?? 16;

  return h(
    "span",
    { class: "action-icon" },
    h(
      "svg",
      {
        viewBox: "0 0 24 24",
        "aria-hidden": "true",
        width: size,
        height: size,
        fill: options.stroke ? "none" : "currentColor",
        stroke: options.stroke ? "currentColor" : "none",
        "stroke-width": options.stroke ? 2 : undefined,
        "stroke-linecap": options.stroke ? "round" : undefined,
        "stroke-linejoin": options.stroke ? "round" : undefined,
      },
      [h("path", { d: path })],
    ),
  );
}

export const appIconPaths = {
  search: "M10.5 4a6.5 6.5 0 1 0 4.06 11.58l4.43 4.43 1.41-1.41-4.43-4.43A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z",
  import: "M11 4h2v8.17l2.59-2.58L17 11l-5 5-5-5 1.41-1.41L11 12.17V4Zm-6 14h14v2H5v-2Z",
  detail:
    "M12 5c5.23 0 9.27 3.36 10.71 6.45a1.2 1.2 0 0 1 0 1.1C21.27 15.64 17.23 19 12 19S2.73 15.64 1.29 12.55a1.2 1.2 0 0 1 0-1.1C2.73 8.36 6.77 5 12 5Zm0 2C7.93 7 4.62 9.48 3.3 12 4.62 14.52 7.93 17 12 17s7.38-2.48 8.7-5C19.38 9.48 16.07 7 12 7Zm0 2.5A2.5 2.5 0 1 1 12 14.5a2.5 2.5 0 0 1 0-5Z",
  theme:
    "M12 3a9 9 0 1 0 0 18h1.5a3.5 3.5 0 0 0 0-7H13a2 2 0 0 1 0-4h4a3 3 0 0 0 3-3v-.5A9.01 9.01 0 0 0 12 3Zm-4 6a1.5 1.5 0 1 1 0 3A1.5 1.5 0 0 1 8 9Zm8-1.5A1.5 1.5 0 1 1 16 10a1.5 1.5 0 0 1 0-3Zm-6 8A1.5 1.5 0 1 1 10 18a1.5 1.5 0 0 1 0-3Z",
  variant: "M7 4h10v2H7V4Zm-2 4h14v2H5V8Zm2 4h10v2H7v-2Zm-2 4h14v2H5v-2Z",
  refresh: "M12 5a7 7 0 1 1-6.32 4H3l3.5-3.5L10 9H7.78A5 5 0 1 0 12 7V5Z",
  validate: "M9.55 16.6 5.4 12.45l1.4-1.4 2.75 2.74 7.65-7.64 1.4 1.41-9.05 9.04Z",
  edit:
    "m3 17.25 9.88-9.88 3.75 3.75L6.75 21H3v-3.75Zm11.71-11.46 1.58-1.58a1 1 0 0 1 1.42 0l2.5 2.5a1 1 0 0 1 0 1.41L18.62 9.7l-3.91-3.91Z",
  delete: "M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v8h-2v-8Zm4 0h2v8h-2v-8ZM7 10h2v8H7v-8Z",
  copy: "M16 1H6a2 2 0 0 0-2 2v12h2V3h10V1Zm3 4H10a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H10V7h9v14Z",
  retry: "M12 5a7 7 0 1 1-6.32 4H3l3.5-3.5L10 9H7.78A5 5 0 1 0 12 7V5Z",
};
