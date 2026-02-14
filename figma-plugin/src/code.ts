/// <reference types="@figma/plugin-typings" />

import { extractNode } from "./extractor";
import { toA2UI } from "./converter";

figma.showUI(__html__, { width: 400, height: 500 });

figma.ui.onmessage = async (msg: { type: string }) => {
  if (msg.type === "extract-selection") {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.ui.postMessage({ type: "error", message: "No component selected" });
      return;
    }

    const node = selection[0];
    const extracted = extractNode(node);
    const a2ui = toA2UI(extracted);

    figma.ui.postMessage({ type: "a2ui-result", data: a2ui });
  }

  if (msg.type === "cancel") {
    figma.closePlugin();
  }
};
