import { ChangedFileFolder } from "@/components/git/changed-file-folder";
import { ChangedFileRow } from "@/components/git/changed-file-row";
import type { FileTreeNode } from "@/lib/git/file-tree";

export type ChangedFileTreeProps = Readonly<{
  nodes: readonly FileTreeNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}>;

export function ChangedFileTree({
  nodes,
  selectedPath,
  onSelect,
}: ChangedFileTreeProps) {
  return (
    <ul className="flex min-w-0 flex-col gap-0.5">
      {nodes.map((node) =>
        node.type === "folder" ? (
          <li key={node.path} className="min-w-0">
            <ChangedFileFolder folder={node}>
              <ChangedFileTree
                nodes={node.children}
                selectedPath={selectedPath}
                onSelect={onSelect}
              />
            </ChangedFileFolder>
          </li>
        ) : (
          <li key={node.path} className="min-w-0">
            <ChangedFileRow
              change={node.change}
              selected={selectedPath === node.path}
              onSelect={onSelect}
            />
          </li>
        ),
      )}
    </ul>
  );
}
