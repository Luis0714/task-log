import type { IconType } from "react-icons";
import {
  FcAudioFile,
  FcDocument,
  FcPackage,
  FcPicture,
  FcVideoFile,
} from "react-icons/fc";
import {
  SiCss,
  SiDocker,
  SiEslint,
  SiGit,
  SiGo,
  SiGraphql,
  SiHtml5,
  SiJavascript,
  SiMarkdown,
  SiNextdotjs,
  SiNpm,
  SiPrisma,
  SiPython,
  SiReact,
  SiRust,
  SiSass,
  SiTailwindcss,
  SiTypescript,
  SiVuedotjs,
} from "react-icons/si";
import { VscJson } from "react-icons/vsc";

export type FileTypeIconSpec = {
  icon: IconType;
  color?: string;
};

const BY_EXTENSION: Record<string, FileTypeIconSpec> = {
  ts: { icon: SiTypescript, color: "#3178c6" },
  tsx: { icon: SiReact, color: "#61dafb" },
  js: { icon: SiJavascript, color: "#f7df1e" },
  jsx: { icon: SiReact, color: "#61dafb" },
  mjs: { icon: SiJavascript, color: "#f7df1e" },
  cjs: { icon: SiJavascript, color: "#f7df1e" },
  py: { icon: SiPython, color: "#3776ab" },
  css: { icon: SiCss, color: "#264de4" },
  scss: { icon: SiSass, color: "#cc6699" },
  sass: { icon: SiSass, color: "#cc6699" },
  less: { icon: SiCss, color: "#1d365d" },
  html: { icon: SiHtml5, color: "#e34f26" },
  htm: { icon: SiHtml5, color: "#e34f26" },
  json: { icon: VscJson, color: "#cbcb41" },
  md: { icon: SiMarkdown, color: "#083fa1" },
  mdx: { icon: SiMarkdown, color: "#083fa1" },
  svg: { icon: FcPicture },
  png: { icon: FcPicture },
  jpg: { icon: FcPicture },
  jpeg: { icon: FcPicture },
  gif: { icon: FcPicture },
  webp: { icon: FcPicture },
  ico: { icon: FcPicture },
  pdf: { icon: FcDocument },
  doc: { icon: FcDocument },
  docx: { icon: FcDocument },
  txt: { icon: FcDocument },
  mp3: { icon: FcAudioFile },
  wav: { icon: FcAudioFile },
  ogg: { icon: FcAudioFile },
  mp4: { icon: FcVideoFile },
  webm: { icon: FcVideoFile },
  mov: { icon: FcVideoFile },
  zip: { icon: FcPackage },
  gz: { icon: FcPackage },
  tgz: { icon: FcPackage },
  yml: { icon: VscJson, color: "#cb171e" },
  yaml: { icon: VscJson, color: "#cb171e" },
  graphql: { icon: SiGraphql, color: "#e10098" },
  gql: { icon: SiGraphql, color: "#e10098" },
  prisma: { icon: SiPrisma, color: "#2d3748" },
  go: { icon: SiGo, color: "#00add8" },
  rs: { icon: SiRust, color: "#dea584" },
  vue: { icon: SiVuedotjs, color: "#42b883" },
  sql: { icon: VscJson, color: "#336791" },
};

const BY_FILE_NAME: Record<string, FileTypeIconSpec> = {
  "package.json": { icon: SiNpm, color: "#cb3837" },
  "package-lock.json": { icon: SiNpm, color: "#cb3837" },
  "tsconfig.json": { icon: SiTypescript, color: "#3178c6" },
  "next.config.ts": { icon: SiNextdotjs, color: "#000000" },
  "next.config.js": { icon: SiNextdotjs, color: "#000000" },
  "next.config.mjs": { icon: SiNextdotjs, color: "#000000" },
  "tailwind.config.ts": { icon: SiTailwindcss, color: "#38bdf8" },
  "tailwind.config.js": { icon: SiTailwindcss, color: "#38bdf8" },
  "eslint.config.js": { icon: SiEslint, color: "#4b32c3" },
  "eslint.config.mjs": { icon: SiEslint, color: "#4b32c3" },
  ".eslintrc": { icon: SiEslint, color: "#4b32c3" },
  ".eslintrc.json": { icon: SiEslint, color: "#4b32c3" },
  ".prettierrc": { icon: VscJson, color: "#f7b93e" },
  dockerfile: { icon: SiDocker, color: "#2496ed" },
  ".dockerignore": { icon: SiDocker, color: "#2496ed" },
  ".gitignore": { icon: SiGit, color: "#f05032" },
  ".gitattributes": { icon: SiGit, color: "#f05032" },
};

const DEFAULT_FILE_ICON: FileTypeIconSpec = { icon: FcDocument };

export function resolveFileTypeIcon(
  fileName: string,
  extension: string,
): FileTypeIconSpec {
  const byName = BY_FILE_NAME[fileName.toLowerCase()];
  if (byName) return byName;
  return BY_EXTENSION[extension] ?? DEFAULT_FILE_ICON;
}
