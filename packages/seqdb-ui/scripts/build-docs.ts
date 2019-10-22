// tslint:disable-next-line: no-var-requires
const Asciidoctor = require("asciidoctor.js");

const asciidoctor = Asciidoctor();

asciidoctor.convertFile("../docs/index.adoc", {
  attributes: ["copycss", "toc=left"],
  mkdirs: true,
  safe: "unsafe",
  to_dir: "../generated-docs/"
});
