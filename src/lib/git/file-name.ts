export function fileNameFromPath(path: string): string {
  return path.split("/").at(-1) ?? path;
}

export function fileExtension(fileName: string): string {
  const name = fileNameFromPath(fileName).toLowerCase();
  if (name.startsWith(".") && !name.slice(1).includes(".")) {
    return name.slice(1);
  }

  const parts = name.split(".");
  if (parts.length < 2) return "";
  if (parts.at(-2) === "d" && parts.at(-1) === "ts") return "ts";
  return parts.at(-1) ?? "";
}
