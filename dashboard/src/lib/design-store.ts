import * as fs from "fs";
import * as path from "path";
import { A2UIMessage } from "./a2ui-types";

const DESIGNS_DIR = path.join(process.cwd(), "..", "examples");

export interface StoredDesign {
  id: string; // surfaceId
  name: string;
  messages: A2UIMessage[];
  updatedAt: string;
}

/** List all stored designs. */
export function listDesigns(): StoredDesign[] {
  if (!fs.existsSync(DESIGNS_DIR)) return [];

  const files = fs.readdirSync(DESIGNS_DIR).filter((f) => f.endsWith(".a2ui.json"));
  return files.map((file) => {
    const filePath = path.join(DESIGNS_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const messages: A2UIMessage[] = JSON.parse(content);
    const surfaceMsg = messages.find((m) => "createSurface" in m);
    const surfaceId = surfaceMsg && "createSurface" in surfaceMsg ? surfaceMsg.createSurface.surfaceId : file.replace(".a2ui.json", "");
    const stat = fs.statSync(filePath);

    return {
      id: surfaceId,
      name: surfaceId.replace(/_/g, " "),
      messages,
      updatedAt: stat.mtime.toISOString(),
    };
  });
}

/** Get a single design by surfaceId. */
export function getDesign(id: string): StoredDesign | null {
  const designs = listDesigns();
  return designs.find((d) => d.id === id) ?? null;
}

/** Save a design (creates/overwrites the file). */
export function saveDesign(id: string, messages: A2UIMessage[]): StoredDesign {
  if (!fs.existsSync(DESIGNS_DIR)) {
    fs.mkdirSync(DESIGNS_DIR, { recursive: true });
  }

  const fileName = `${id}.a2ui.json`;
  const filePath = path.join(DESIGNS_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));

  return {
    id,
    name: id.replace(/_/g, " "),
    messages,
    updatedAt: new Date().toISOString(),
  };
}
