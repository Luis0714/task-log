export function stripHtmlTags(input: string): string {
  let out = "";
  let inTag = false;
  for (const ch of input) {
    if (ch === "<") {
      inTag = true;
    } else if (ch === ">") {
      inTag = false;
    } else if (!inTag) {
      out += ch;
    }
  }
  return out;
}