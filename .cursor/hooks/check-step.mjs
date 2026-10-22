import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const PRETTIER_EXT = new Set([".js", ".jsx", ".ts", ".tsx", ".json", ".html"]);
const ESLINT_EXT = new Set([".js", ".jsx", ".ts", ".tsx"]);
const TYPE_EXT = new Set([".ts", ".tsx"]);

const BINS = {
  prettier: ["prettier", "bin", "prettier.cjs"],
  eslint: ["eslint", "bin", "eslint.js"],
  tsc: ["typescript", "bin", "tsc"],
};

function emitHook(message) {
  const payload = message ? { followup_message: message } : {};
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

function isStudia(root) {
  const packagePath = path.join(root, "package.json");
  if (!existsSync(packagePath)) return false;

  try {
    const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
    return pkg.name === "studia-lms-web" && typeof pkg.scripts?.typecheck === "string";
  } catch {
    return false;
  }
}

function normalizeFiles(root, files) {
  const rootResolved = path.resolve(root);
  const selected = [];

  for (const file of files) {
    if (typeof file !== "string" || file.length === 0) continue;

    const absolute = path.resolve(rootResolved, file);
    const relative = path.relative(rootResolved, absolute);
    const portable = relative.split(path.sep).join("/");

    if (relative.startsWith("..") || path.isAbsolute(relative)) continue;
    if (portable.startsWith("node_modules/") || portable.startsWith(".next/") || portable.startsWith("dist/")) {
      continue;
    }

    selected.push(absolute);
  }

  return [...new Set(selected)];
}

function filesWithExtension(files, extensions) {
  return files.filter((file) => extensions.has(path.extname(file).toLowerCase()));
}

function runNode(root, script, args, timeoutMs) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    encoding: "utf8",
    timeout: timeoutMs,
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 4,
  });

  return {
    status: result.status,
    signal: result.signal,
    error: result.error ? String(result.error.message ?? result.error) : "",
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
  };
}

function describeResult(result) {
  if (result.error) return `no se pudo ejecutar (${result.error})`;
  if (result.status === 0) return "pasó";

  const signal = result.signal ? `, señal ${result.signal}` : "";
  const code = result.status ?? "sin código";
  return `falló (código ${code}${signal})`;
}

function section(title, result) {
  const details = result.output ? `\n${result.output}` : "";
  return `### ${title}: ${describeResult(result)}${details}`;
}

function toolScript(root, name) {
  const script = path.join(root, "node_modules", ...BINS[name]);
  return existsSync(script) ? script : "";
}

function checkFiles(root, files, withTypes) {
  const sections = [];
  let failed = false;
  const prettierFiles = filesWithExtension(files, PRETTIER_EXT);
  const eslintFiles = filesWithExtension(files, ESLINT_EXT);
  const typeFiles = filesWithExtension(files, TYPE_EXT);

  if (prettierFiles.length > 0) {
    const script = toolScript(root, "prettier");
    const result = script
      ? runNode(root, script, ["--check", "--ignore-unknown", ...prettierFiles], 30000)
      : { status: null, signal: null, error: "No está instalado prettier del proyecto.", output: "" };
    sections.push(section("Prettier", result));
    if (result.status !== 0) failed = true;
  }

  if (eslintFiles.length > 0) {
    const script = toolScript(root, "eslint");
    const result = script
      ? runNode(root, script, eslintFiles, 50000)
      : { status: null, signal: null, error: "No está instalado eslint del proyecto.", output: "" };
    sections.push(section("ESLint", result));
    if (result.status !== 0) failed = true;
  }

  if (withTypes && typeFiles.length > 0) {
    const script = toolScript(root, "tsc");
    const result = script
      ? runNode(root, script, ["--noEmit"], 80000)
      : { status: null, signal: null, error: "No está instalado typescript del proyecto.", output: "" };
    sections.push(section("TypeScript (tsc --noEmit)", result));
    if (result.status !== 0) failed = true;
  }

  const checked = files.map((file) => path.relative(root, file).split(path.sep).join("/")).join("\n");
  const report = [`Archivos comprobados:`, checked, "", sections.join("\n\n")].join("\n");

  return { failed, report };
}

function truncate(text) {
  const max = 8000;
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n[salida truncada]`;
}

function followup(report) {
  return [
    "Quality check for this implementation step.",
    "Include the report below verbatim in your final answer to the user.",
    "Do not edit files. Do not fix the findings. Do not start another step. Stop after reporting.",
    "",
    truncate(report),
  ].join("\n");
}

function workspaceRoot(input) {
  const roots = Array.isArray(input.workspace_roots) ? input.workspace_roots : [];
  return roots.find((candidate) => typeof candidate === "string" && isStudia(candidate)) ?? "";
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8").trim();
}

function fromArgs(args) {
  const withTypes = args.includes("--with-types");
  const requested = args.filter((arg) => arg !== "--with-types");
  const root = process.cwd();

  if (!isStudia(root)) {
    console.error("Ejecuta este comando desde la raíz de studia-lms-web.");
    process.exit(1);
  }

  if (requested.length === 0) {
    console.error("Uso: node .cursor/hooks/check-step.mjs [--with-types] archivo1 archivo2");
    process.exit(1);
  }

  const files = normalizeFiles(root, requested);
  if (files.length === 0) {
    console.error("Ningún archivo queda dentro del proyecto.");
    process.exit(1);
  }

  const { failed, report } = checkFiles(root, files, withTypes);
  console.log(report);
  process.exit(failed ? 1 : 0);
}

async function fromHook() {
  const stdin = await readStdin();
  if (!stdin) {
    emitHook("");
    return;
  }

  let input;
  try {
    input = JSON.parse(stdin);
  } catch {
    emitHook("");
    return;
  }

  const root = workspaceRoot(input);
  const completed = input.status === "completed";
  const alreadyContinued = Number(input.loop_count ?? 0) > 0;
  const isImplementer = input.subagent_type === "step-implementer";

  if (!root || !completed || alreadyContinued || !isImplementer) {
    emitHook("");
    return;
  }

  const files = normalizeFiles(root, Array.isArray(input.modified_files) ? input.modified_files : []);
  const checkable = files.filter((file) => {
    const extension = path.extname(file).toLowerCase();
    return PRETTIER_EXT.has(extension) || ESLINT_EXT.has(extension);
  });

  if (checkable.length === 0) {
    emitHook("");
    return;
  }

  const { report } = checkFiles(root, checkable, true);
  emitHook(followup(report));
}

const args = process.argv.slice(2);
if (args.length > 0) {
  fromArgs(args);
} else {
  await fromHook();
}
