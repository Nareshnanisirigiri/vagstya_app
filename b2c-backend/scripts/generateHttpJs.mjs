import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve("c:/Users/sirin/OneDrive/Desktop/jewellry_main");
const sourceRoot = path.join(projectRoot, "Http");
const targetRoot = path.join(projectRoot, "b2c-backend", "converted-http");
const manualOverrides = new Set(["Controllers/Admin/AdController.js"]);
const inPlaceTargetRoot = sourceRoot;

function walkPhpFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkPhpFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".php")) {
      files.push(fullPath);
    }
  }

  return files;
}

function toJsRelativePath(phpPath) {
  return path.relative(sourceRoot, phpPath).replace(/\.php$/i, ".js");
}

function getClassName(phpSource, fallbackName) {
  const classMatch = phpSource.match(/class\s+([A-Za-z0-9_]+)/);
  return classMatch?.[1] ?? fallbackName;
}

function getPublicMethodNames(phpSource) {
  return [...phpSource.matchAll(/public function\s+([A-Za-z0-9_]+)\s*\(/g)].map((match) => match[1]);
}

function toCamelCase(value) {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function renderController(relativePhpPath, phpSource, fallbackName) {
  const className = getClassName(phpSource, fallbackName);
  const methodNames = getPublicMethodNames(phpSource).filter((name) => name !== "__construct");

  const methods = methodNames.length
    ? methodNames
        .map(
          (name) => `  async ${name}(req, res) {
    return res.status(501).json({
      message: "${className}.${name} is not implemented yet.",
      source: "${relativePhpPath.replace(/\\/g, "/")}"
    });
  }`
        )
        .join("\n\n")
    : `  async handle(req, res) {
    return res.status(501).json({
      message: "${className} is not implemented yet.",
      source: "${relativePhpPath.replace(/\\/g, "/")}"
    });
  }`;

  return `// Auto-generated from ${relativePhpPath.replace(/\\/g, "/")}

export class ${className} {
${methods}
}

export const ${toCamelCase(className)} = new ${className}();
`;
}

function renderMiddleware(relativePhpPath, phpSource, fallbackName) {
  const className = getClassName(phpSource, fallbackName);
  const exportName = toCamelCase(className);

  return `// Auto-generated from ${relativePhpPath.replace(/\\/g, "/")}

export function ${exportName}(req, res, next) {
  next();
}
`;
}

function renderRequest(relativePhpPath, phpSource, fallbackName) {
  const className = getClassName(phpSource, fallbackName);
  const exportName = `validate${className}`;
  const ruleLines = [...phpSource.matchAll(/'([^']+)'\s*=>/g)].map((match) => match[1]);

  const rulesComment = ruleLines.length
    ? `// Fields seen in source: ${ruleLines.join(", ")}`
    : "// No fields extracted from source.";

  return `// Auto-generated from ${relativePhpPath.replace(/\\/g, "/")}
${rulesComment}

export function ${exportName}(req, res, next) {
  next();
}
`;
}

function renderResource(relativePhpPath, phpSource, fallbackName) {
  const className = getClassName(phpSource, fallbackName);
  const exportName = `serialize${className}`;

  return `// Auto-generated from ${relativePhpPath.replace(/\\/g, "/")}

export function ${exportName}(resource) {
  return resource;
}
`;
}

function renderKernel(relativePhpPath) {
  return `// Auto-generated from ${relativePhpPath.replace(/\\/g, "/")}

export const middleware = [];
export const middlewareGroups = {};
export const routeMiddleware = {};
`;
}

function renderDefault(relativePhpPath, fallbackName) {
  return `// Auto-generated from ${relativePhpPath.replace(/\\/g, "/")}

export const ${toCamelCase(fallbackName)} = {};
`;
}

function renderFile(phpPath) {
  const relativePhpPath = path.relative(projectRoot, phpPath);
  const phpSource = fs.readFileSync(phpPath, "utf8");
  const fallbackName = path.basename(phpPath, ".php");

  if (relativePhpPath === "Http\\Kernel.php") {
    return renderKernel(relativePhpPath);
  }

  if (relativePhpPath.includes("\\Controllers\\")) {
    return renderController(relativePhpPath, phpSource, fallbackName);
  }

  if (relativePhpPath.includes("\\Middleware\\")) {
    return renderMiddleware(relativePhpPath, phpSource, fallbackName);
  }

  if (relativePhpPath.includes("\\Requests\\")) {
    return renderRequest(relativePhpPath, phpSource, fallbackName);
  }

  if (relativePhpPath.includes("\\Resources\\")) {
    return renderResource(relativePhpPath, phpSource, fallbackName);
  }

  return renderDefault(relativePhpPath, fallbackName);
}

fs.mkdirSync(targetRoot, { recursive: true });

const phpFiles = walkPhpFiles(sourceRoot);

for (const phpFile of phpFiles) {
  const relativeJsPath = toJsRelativePath(phpFile);
  const targetPath = path.join(targetRoot, relativeJsPath);

  if (manualOverrides.has(relativeJsPath.replace(/\\/g, "/")) && fs.existsSync(targetPath)) {
    continue;
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, renderFile(phpFile), "utf8");
}

const manifestPath = path.join(targetRoot, "manifest.json");
fs.writeFileSync(
  manifestPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      sourceRoot,
      totalPhpFiles: phpFiles.length,
      files: phpFiles.map((phpFile) => ({
        php: path.relative(projectRoot, phpFile).replace(/\\/g, "/"),
        js: path.relative(projectRoot, path.join(targetRoot, toJsRelativePath(phpFile))).replace(/\\/g, "/")
      }))
    },
    null,
    2
  ),
  "utf8"
);

console.log(`Generated ${phpFiles.length} JS files in ${targetRoot}`);

if (process.argv.includes("--in-place")) {
  for (const phpFile of phpFiles) {
    const relativeJsPath = toJsRelativePath(phpFile);
    const targetPath = path.join(inPlaceTargetRoot, relativeJsPath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, renderFile(phpFile), "utf8");
  }

  console.log(`Generated ${phpFiles.length} JS files in ${inPlaceTargetRoot}`);
}
