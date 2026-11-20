import { readFileSync } from "fs";
import { join } from "path";
import { Z_INDEX } from "../zIndex";

describe("Z_INDEX", () => {
  it("matches the CSS variables in z-index.css", () => {
    const css = readFileSync(join(__dirname, "../z-index.css"), "utf8");
    const cssVars = Object.fromEntries(
      [...css.matchAll(/--dina-z-([\w-]+):\s*(-?\d+)/g)].map(
        ([, name, value]) => [
          name.replace(/-(\w)/g, (_, c) => c.toUpperCase()),
          Number(value)
        ]
      )
    );
    expect(cssVars).toEqual(Z_INDEX);
  });
});
