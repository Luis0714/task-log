export function stripHtmlTags(input: string): string {
  let out = "";
  let inTag = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    if (ch === "<") {
      inTag = true;
      continue;
    }
    if (ch === ">") {
      inTag = false;
      continue;
    }
    if (!inTag) out += ch;
  }
  return out;
}