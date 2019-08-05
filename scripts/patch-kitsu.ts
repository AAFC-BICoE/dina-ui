import { readFileSync, unlink, writeFileSync } from "fs";
import { noop } from "lodash";
import { join } from "path";

// tslint:disable-next-line: no-console
console.log("patch-kitsu.ts: Patching kitsu packages for IE11 compatibility.");

const kitsuMjs = join(__dirname, "../node_modules/kitsu/lib/index.mjs");
const kitsuCoreMjs = join(
  __dirname,
  "../node_modules/kitsu-core/lib/index.mjs"
);

// Delete "mjs" files, which are not supported by next-transpile-modules.
// These file would otherwise be imported by default, taking priority over the equivalent "js"
// files in the same directory.
unlink(kitsuMjs, noop);
unlink(kitsuCoreMjs, noop);

const kitsuCoreIndexFilePath = join(
  __dirname,
  "../node_modules/kitsu-core/lib/index.js"
);

const currentCode = readFileSync(kitsuCoreIndexFilePath, "utf-8");

// Patch the code so it works in the next.js build.
const newCode = currentCode.replace(
  /Object\.defineProperty\(exports, '__esModule', { value: true }\);/g,
  "exports = module.exports;"
);

writeFileSync(kitsuCoreIndexFilePath, newCode, "utf8");
