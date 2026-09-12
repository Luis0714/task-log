import type { GitFileChange } from "@/lib/git/changeset";
import { sumDiffStats } from "@/lib/git/sum-diff-stats";

export type FileTreeFile = {
  type: "file";
  name: string;
  path: string;
  change: GitFileChange;
};

export type FileTreeFolder = {
  type: "folder";
  name: string;
  path: string;
  children: FileTreeNode[];
  additions: number;
  deletions: number;
};

export type FileTreeNode = FileTreeFile | FileTreeFolder;

type MutableFolder = {
  type: "folder";
  name: string;
  path: string;
  children: Map<string, MutableFolder | FileTreeFile>;
};

function folderStats(children: FileTreeNode[]) {
  return sumDiffStats(
    children.map((node) =>
      node.type === "file"
        ? node.change
        : { additions: node.additions, deletions: node.deletions },
    ),
  );
}

function toNodes(entries: Map<string, MutableFolder | FileTreeFile>): FileTreeNode[] {
  const nodes: FileTreeNode[] = [];

  for (const entry of entries.values()) {
    if (entry.type === "file") {
      nodes.push(entry);
      continue;
    }

    const children = toNodes(entry.children);
    const stats = folderStats(children);
    nodes.push({
      type: "folder",
      name: entry.name,
      path: entry.path,
      children,
      additions: stats.additions,
      deletions: stats.deletions,
    });
  }

  return nodes.sort((left, right) => {
    if (left.type !== right.type) return left.type === "folder" ? -1 : 1;
    return left.name.localeCompare(right.name);
  });
}

export function buildFileTree(files: readonly GitFileChange[]): FileTreeNode[] {
  const root: MutableFolder = {
    type: "folder",
    name: "",
    path: "",
    children: new Map(),
  };

  for (const change of files) {
    const parts = change.path.split("/").filter(Boolean);
    let current = root;

    for (const [index, name] of parts.entries()) {
      const isFile = index === parts.length - 1;
      const path = parts.slice(0, index + 1).join("/");

      if (isFile) {
        current.children.set(name, {
          type: "file",
          name,
          path: change.path,
          change,
        });
        continue;
      }

      const existing = current.children.get(name);
      if (existing?.type === "folder") {
        current = existing;
        continue;
      }

      const folder: MutableFolder = {
        type: "folder",
        name,
        path,
        children: new Map(),
      };
      current.children.set(name, folder);
      current = folder;
    }
  }

  return toNodes(root.children);
}
