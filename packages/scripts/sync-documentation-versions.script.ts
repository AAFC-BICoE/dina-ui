import * as fs from "fs";
import * as path from "path";

interface VersionMapping {
  [key: string]: {
    packageJsonPath: string;
    packageName: string;
    versionVar: string;
  };
}

const VERSION_MAPPINGS: VersionMapping = {
  yarn: {
    packageJsonPath: "package.json",
    packageName: "packageManager",
    versionVar: "var_yarn_version"
  },
  typescript: {
    packageJsonPath: "package.json",
    packageName: "typescript",
    versionVar: "var_typescript_version"
  },
  react: {
    packageJsonPath: "packages/dina-ui/package.json",
    packageName: "react",
    versionVar: "var_react_version"
  },
  nextjs: {
    packageJsonPath: "packages/dina-ui/package.json",
    packageName: "next",
    versionVar: "var_nextjs_version"
  },
  bootstrap: {
    packageJsonPath: "packages/dina-ui/package.json",
    packageName: "bootstrap",
    versionVar: "var_bootstrap_version"
  },
  jest: {
    packageJsonPath: "package.json",
    packageName: "jest",
    versionVar: "var_jest_version"
  },
  formik: {
    packageJsonPath: "packages/common-ui/package.json",
    packageName: "formik",
    versionVar: "var_formik_version"
  },
  keycloak: {
    packageJsonPath: "packages/common-ui/package.json",
    packageName: "keycloak-js",
    versionVar: "var_keycloak_version"
  },
  kitsu: {
    packageJsonPath: "packages/common-ui/package.json",
    packageName: "kitsu",
    versionVar: "var_kitsu_version"
  },
  reactTable: {
    packageJsonPath: "packages/common-ui/package.json",
    packageName: "@tanstack/react-table",
    versionVar: "var_react_table_version"
  },
  echarts: {
    packageJsonPath: "packages/common-ui/package.json",
    packageName: "echarts",
    versionVar: "var_echarts_version"
  },
  esriLoader: {
    packageJsonPath: "packages/dina-ui/package.json",
    packageName: "esri-loader",
    versionVar: "var_esri_loader_version"
  }
};

function extractVersion(packageJson: any, packageName: string): string {
  // Handle special cases
  if (packageName === "packageManager") {
    // Extract version from "yarn@1.22.21+sha1..."
    const match = packageJson.packageManager?.match(/yarn@([\d.]+)/);
    return match ? match[1] : "";
  }

  if (packageName.startsWith("engines.")) {
    const engine = packageName.split(".")[1];
    return packageJson.engines?.[engine] || "";
  }

  // Check dependencies and devDependencies
  const version =
    packageJson.dependencies?.[packageName] ||
    packageJson.devDependencies?.[packageName] ||
    "";

  // Remove ^ and ~ prefixes
  return version.replace(/^[\^~]/, "");
}

function syncVersions() {
  const rootDir = path.resolve(__dirname, "../..");
  const versionsPath = path.join(rootDir, "docs/versions.adoc");

  // Read current versions.adoc
  let content = fs.readFileSync(versionsPath, "utf-8");

  let hasChanges = false;

  // Update each version
  for (const [key, config] of Object.entries(VERSION_MAPPINGS)) {
    const packageJsonPath = path.join(rootDir, config.packageJsonPath);
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    const version = extractVersion(packageJson, config.packageName);

    if (version) {
      // Replace the version line
      const regex = new RegExp(`^:${config.versionVar}:.*$`, "m");
      const oldContent = content;
      content = content.replace(regex, `:${config.versionVar}: ${version}`);

      if (oldContent !== content) {
        // eslint-disable-next-line no-console
        console.log(`✓ Updated ${config.versionVar} to ${version}`);
        hasChanges = true;
      }
    } else {
      console.warn(`⚠ Could not find version for ${key}`);
    }
  }

  if (hasChanges) {
    // Write updated content
    fs.writeFileSync(versionsPath, content, "utf-8");
    // eslint-disable-next-line no-console
    console.log("\n✅ versions.adoc updated successfully!");
  } else {
    // eslint-disable-next-line no-console
    console.log("\n✅ versions.adoc is already up to date!");
  }
}

syncVersions();

// Made with Bob
