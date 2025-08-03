import path from "node:path";
import fs from "node:fs";
import { Project, SourceFile } from "ts-morph";

export function getAffectedTestFiles(
  changedFiles: string[],
  projectOrPath: string | Project = "tsconfig.json",
  changedPackages: string[] = [],
  runAllTestsPackages: string[] = []
): { affectedTests: string[], shouldRunAllTests: boolean } {
  const isProjectPath = typeof projectOrPath === "string";
  const tsConfigPath = isProjectPath ? path.resolve(projectOrPath) : undefined;
  const basePath = isProjectPath ? path.dirname(tsConfigPath!) : process.cwd();

  const project = isProjectPath
    ? new Project({ tsConfigFilePath: tsConfigPath! })
    : projectOrPath;

  // Check if any changed package should trigger running all tests
  const shouldRunAllTests = changedPackages.some(pkg => 
    runAllTestsPackages.includes(pkg)
  );

  if (shouldRunAllTests) {
    console.log(`Running all tests because of changed packages: ${changedPackages.filter(pkg => runAllTestsPackages.includes(pkg)).join(', ')}`);
    
    return {
      affectedTests: [],
      shouldRunAllTests: true
    };
  }

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

  // Add files directly changed
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

  // Add files using changed packages
  if (changedPackages.length > 0) {
    const filesUsingChangedPackages = getFilesUsingPackages(changedPackages, project);
    for (const file of filesUsingChangedPackages) {
      const absPath = path.resolve(basePath, file);
      affected.add(absPath);
      
      // Also add files that depend on these files
      const dependents = reverseDeps.get(absPath);
      if (dependents) {
        const packageQueue = [absPath];
        const packageVisited = new Set<string>();
        
        while (packageQueue.length > 0) {
          const current = packageQueue.pop();
          if (!current || packageVisited.has(current)) continue;
          
          packageVisited.add(current);
          affected.add(current);
          
          const currentDependents = reverseDeps.get(current);
          if (currentDependents) {
            for (const dep of currentDependents) {
              if (!packageVisited.has(dep)) {
                packageQueue.push(dep);
              }
            }
          }
        }
      }
    }
  }

  const affectedTests = Array.from(affected)
    .filter((f) => /\.(test|spec)\.(ts|tsx)$/.test(f))
    .filter((f) => fs.existsSync(f)) // Filter out deleted files
    .map((absPath) => path.relative(basePath, absPath))
    // If the relative path starts with '..', it might belong to another package in a monorepo environment, so filter it out.
    .filter((f) => !f.startsWith(".."));

  return {
    affectedTests,
    shouldRunAllTests: false
  };
}

export function getFilesUsingPackages(
  packageNames: string[],
  projectOrPath: string | Project = "tsconfig.json"
): string[] {
  if (packageNames.length === 0) {
    return [];
  }

  const isProjectPath = typeof projectOrPath === "string";
  const tsConfigPath = isProjectPath ? path.resolve(projectOrPath) : undefined;
  const basePath = isProjectPath ? path.dirname(tsConfigPath!) : process.cwd();

  const project = isProjectPath
    ? new Project({ tsConfigFilePath: tsConfigPath! })
    : projectOrPath;

  const filesUsingPackages = new Set<string>();

  for (const sf of project.getSourceFiles()) {
    const filePath = sf.getFilePath().toString();
    
    const imports = sf.getImportDeclarations();
    for (const importDecl of imports) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      
      // Check if any of the changed packages are used
      for (const packageName of packageNames) {
        if (isImportFromPackage(moduleSpecifier, packageName)) {
          filesUsingPackages.add(filePath);
          break;
        }
      }
    }
  }

  return Array.from(filesUsingPackages)
    .filter((f) => fs.existsSync(f))
    .map((absPath) => path.relative(basePath, absPath))
    .filter((f) => !f.startsWith(".."));
}

function isImportFromPackage(moduleSpecifier: string, packageName: string): boolean {
  // Direct package import: "react"
  if (moduleSpecifier === packageName) {
    return true;
  }
  
  // Subpath import: "react/jsx-runtime"
  if (moduleSpecifier.startsWith(packageName + "/")) {
    return true;
  }
  
  // Scoped package: "@types/react"
  if (packageName.startsWith("@") && moduleSpecifier.startsWith(packageName)) {
    return true;
  }
  
  return false;
}
