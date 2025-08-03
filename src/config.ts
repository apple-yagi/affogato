import * as fs from "fs";

export interface AffogatoConfig {
  runAllTestsPackages?: string[];
}

export function loadConfig(configPath: string): AffogatoConfig {
  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    const content = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(content) as AffogatoConfig;
    return config;
  } catch (error) {
    console.warn(`Failed to parse config file ${configPath}:`, error);
    return {};
  }
}

export function getRunAllTestsPackages(
  packagesFromInput: string,
  configPath: string
): string[] {
  const packages = new Set<string>();

  // Add packages from input parameter
  if (packagesFromInput) {
    const inputPackages = packagesFromInput
      .split(",")
      .map((pkg) => pkg.trim())
      .filter((pkg) => pkg.length > 0);
    
    inputPackages.forEach((pkg) => packages.add(pkg));
  }

  // Add packages from config file
  if (configPath) {
    const config = loadConfig(configPath);
    if (config.runAllTestsPackages) {
      config.runAllTestsPackages.forEach((pkg) => packages.add(pkg));
    }
  }

  return Array.from(packages);
}