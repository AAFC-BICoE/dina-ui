# Scripts Package

This package contains utility scripts for the DINA UI project.

## Available Scripts

### sync-documentation-versions

Automatically synchronizes version numbers in `docs/versions.adoc` with the actual versions from `package.json` files.

**Usage:**

```bash
# From the root directory
yarn sync-documentation-versions

# Or from the scripts package
cd packages/scripts
yarn sync-documentation-versions
```

**What it does:**

- Reads version numbers from various `package.json` files across the monorepo
- Updates the corresponding version variables in `docs/versions.adoc`
- Ensures documentation stays in sync with actual dependency versions

**Automated execution:**

- Runs automatically on every git commit (via `.husky/pre-commit` hook)
- Automatically stages `docs/versions.adoc` if changes are detected

**Versions tracked:**

- `var_yarn_version` - From root `package.json` packageManager field
- `var_typescript_version` - From root `package.json` devDependencies
- `var_react_version` - From `packages/dina-ui/package.json` dependencies
- `var_nextjs_version` - From `packages/dina-ui/package.json` dependencies
- `var_bootstrap_version` - From `packages/dina-ui/package.json` dependencies
- `var_jest_version` - From root `package.json` devDependencies
- `var_formik_version` - From `packages/common-ui/package.json` dependencies
- `var_keycloak_version` - From `packages/common-ui/package.json` dependencies
- `var_kitsu_version` - From `packages/common-ui/package.json` dependencies
- `var_react_table_version` - From `packages/common-ui/package.json` dependencies
- `var_echarts_version` - From `packages/common-ui/package.json` dependencies
- `var_esri_loader_version` - From `packages/dina-ui/package.json` dependencies

**Note:** `var_node_version` is manually maintained in `docs/versions.adoc` as it's not defined in package.json engines field.

### export-intl-csv

Exports internationalization messages to CSV format for translation.

**Usage:**

```bash
cd packages/scripts
yarn --silent export-intl-csv > messages.csv
```

### import-intl-csv

Imports translated messages from CSV back into TypeScript message files.

**Usage:**

```bash
cd packages/scripts
CSVFILE=messages.csv yarn import-intl-csv
```

## Adding New Version Tracking

To track a new dependency version in `docs/versions.adoc`:

1. Add the version variable to `docs/versions.adoc`:

   ```
   :var_new_package_version: 1.0.0
   ```

2. Update `VERSION_MAPPINGS` in `sync-documentation-versions.script.ts`:

   ```typescript
   newPackage: {
     packageJsonPath: "package.json",  // or "packages/dina-ui/package.json", etc.
     packageName: "package-name",       // exact name in dependencies/devDependencies
     versionVar: "var_new_package_version"
   }
   ```

3. Run `yarn sync-documentation-versions` to test

The script will automatically keep it in sync from that point forward.
