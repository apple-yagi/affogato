import path from "node:path";
import { Project, SourceFile } from "ts-morph";

export function getAffectedTestFiles(
  changedFiles: string[],
  projectOrPath: string | Project = "tsconfig.json"
): string[] {
  const isProjectPath = typeof projectOrPath === "string";
  const tsConfigPath = isProjectPath ? path.resolve(projectOrPath) : undefined;
  const basePath = isProjectPath ? path.dirname(tsConfigPath!) : process.cwd();

  const project = isProjectPath
    ? new Project({ tsConfigFilePath: tsConfigPath! })
    : projectOrPath;

  const fileMap = new Map<string, SourceFile>();
  const reverseDeps = new Map<string, Set<string>>();

  for (const sf of project.getSourceFiles()) {
    const filePath = sf.getFilePath().toString();
    fileMap.set(filePath, sf);

    const deps = sf
      .getImportDeclarations()
      .map((i) => i.getModuleSpecifierSourceFile()?.getFilePath()?.toString())
      .filter((f): f is string => !!f);

    for (const dep of deps) {
      if (!reverseDeps.has(dep)) reverseDeps.set(dep, new Set());
      reverseDeps.get(dep)!.add(filePath);
    }
  }

  const absChangedFiles = changedFiles.map((f) => path.resolve(f));

  const affected = new Set<string>();
  const visited = new Set<string>();
  const queue = [...absChangedFiles];

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current || visited.has(current)) continue;

    visited.add(current);
    affected.add(current);

    const dependents = reverseDeps.get(current);
    if (dependents) {
      for (const dep of dependents) {
        if (!visited.has(dep)) {
          queue.push(dep);
        }
      }
    }
  }

  return (
    Array.from(affected)
      .filter((f) => /\.(test|spec)\.(ts|tsx)$/.test(f))
      .map((absPath) => path.relative(basePath, absPath))
      // If the relative path starts with '..', it might belong to another package in a monorepo environment, so filter it out.
      .filter((f) => !f.startsWith(".."))
  );
}
