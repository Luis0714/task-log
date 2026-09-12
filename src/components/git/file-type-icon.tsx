import { FcFolder } from "react-icons/fc";

import { fileExtension, fileNameFromPath } from "@/lib/git/file-name";
import { resolveFileTypeIcon } from "@/lib/git/file-type-icon";

const ICON_SIZE = 16;

export type FileTypeIconProps = Readonly<{
  name: string;
  folder?: boolean;
}>;

export function FileTypeIcon({ name, folder = false }: FileTypeIconProps) {
  if (folder) {
    return <FcFolder size={ICON_SIZE} className="shrink-0" aria-hidden />;
  }

  const fileName = fileNameFromPath(name);
  const { icon: Icon, color } = resolveFileTypeIcon(fileName, fileExtension(fileName));

  return <Icon size={ICON_SIZE} color={color} className="shrink-0" aria-hidden />;
}
