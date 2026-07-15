import { describe, expect, it } from "vitest";

import { extractImageFiles } from "@/lib/clipboard/extract-image-files";

/**
 * Crea un `DataTransfer` sintético que expone el mismo `File` tanto por
 * `files` como por `items[i].getAsFile()`. Esto reproduce lo que hace un
 * navegador moderno al pegar una captura desde el portapapeles — la causa
 * raíz del bug "pegar inserta la imagen dos veces".
 */
function makeClipboardLikeDataTransfer(files: File[]): DataTransfer {
  const dt = {
    files,
    items: files.map((file) => ({
      kind: "file" as const,
      type: file.type,
      getAsFile: () => file,
    })),
  };

  return dt as unknown as DataTransfer;
}

/** Variante: el navegador expone objetos `File` distintos para la misma imagen
 *  (defensa frente a motores que materializan un nuevo File por cada vía).
 *  Acepta `mutate` para variar `name`/`lastModified` por clon — simula lo que
 *  pasa en producción al pegar capturas, donde `.files[0]` y
 *  `.items[0].getAsFile()` pueden traer `name` y `lastModified` distintos. */
function makeClonedDataTransfer(
  file: File,
  times: number,
  mutate?: (clone: File, index: number) => File,
): DataTransfer {
  const clones: File[] = [];
  for (let i = 0; i < times; i += 1) {
    const next = new File([file], file.name, {
      type: file.type,
      lastModified: file.lastModified,
    });
    clones.push(mutate ? mutate(next, i) : next);
  }

  const dt = {
    files: clones,
    items: clones.map((entry) => ({
      kind: "file" as const,
      type: entry.type,
      getAsFile: () => entry,
    })),
  };

  return dt as unknown as DataTransfer;
}

function makeImage(name: string, type = "image/png"): File {
  return new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], name, { type });
}

describe("extractImageFiles", () => {
  it("devuelve [] si el source es null o undefined", () => {
    expect(extractImageFiles(null)).toEqual([]);
    expect(extractImageFiles(undefined)).toEqual([]);
  });

  it("incluye una imagen pegada UNA sola vez aunque aparezca en files y en items", () => {
    const image = makeImage("captura.png");
    const dt = makeClipboardLikeDataTransfer([image]);

    const result = extractImageFiles(dt);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(image);
  });

  it("preserva el orden cuando hay varias imágenes distintas", () => {
    const a = makeImage("a.png");
    const b = makeImage("b.jpg", "image/jpeg");
    const dt = makeClipboardLikeDataTransfer([a, b]);

    const result = extractImageFiles(dt);

    expect(result).toEqual([a, b]);
  });

  it("ignora archivos que NO son imágenes", () => {
    const png = makeImage("captura.png");
    const pdf = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "doc.pdf", {
      type: "application/pdf",
    });
    const dt = makeClipboardLikeDataTransfer([png, pdf]);

    const result = extractImageFiles(dt);

    expect(result).toEqual([png]);
  });

  it("deduplica incluso si el navegador expone objetos File distintos con la misma huella", () => {
    const image = makeImage("captura.png");
    const dt = makeClonedDataTransfer(image, 4);

    const result = extractImageFiles(dt);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: "captura.png",
      type: "image/png",
      size: image.size,
    });
  });

  it("deduplica cuando name y lastModified varían entre clones (caso real al pegar capturas)", () => {
    const image = makeImage("captura.png");
    const dt = makeClonedDataTransfer(image, 4, (clone, index) => {
      Object.defineProperty(clone, "name", { value: index % 2 === 0 ? "" : "image.png" });
      Object.defineProperty(clone, "lastModified", { value: index * 1_000_000 });
      return clone;
    });

    const result = extractImageFiles(dt);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: "image/png",
      size: image.size,
    });
  });

  it("si un File está en .files pero NO en .items, también lo recoge", () => {

    const image = makeImage("drop.png");
    const dt = {
      files: [image],
      items: [] as unknown as DataTransfer["items"],
    } as unknown as DataTransfer;

    const result = extractImageFiles(dt);

    expect(result).toEqual([image]);
  });

  it("si un File está sólo en .items, también lo recoge", () => {
 
    const image = makeImage("paste.png");
    const dt = {
      files: [],
      items: [
        {
          kind: "file" as const,
          type: image.type,
          getAsFile: () => image,
        },
      ],
    } as unknown as DataTransfer;

    const result = extractImageFiles(dt);

    expect(result).toEqual([image]);
  });
});