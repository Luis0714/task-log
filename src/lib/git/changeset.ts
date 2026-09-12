export type GitDiffLineType = "context" | "addition" | "deletion";

export type GitDiffLine = {
  type: GitDiffLineType;
  oldNumber?: number;
  newNumber?: number;
  content: string;
};

export type GitDiffHunk = {
  header: string;
  lines: GitDiffLine[];
};

export type GitFileChangeKind = "added" | "modified" | "deleted";

export type GitFileChange = {
  path: string;
  kind: GitFileChangeKind;
  additions: number;
  deletions: number;
  hunks: GitDiffHunk[];
};

export type GitCommit = {
  id: string;
  shortId: string;
  message: string;
  author: string;
  authoredAt: string;
};

export type GitChangeset = {
  commits: GitCommit[];
  files: GitFileChange[];
};
