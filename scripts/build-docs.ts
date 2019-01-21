const Asciidoctor = require("asciidoctor.js");

const asciidoctor = Asciidoctor();

asciidoctor.convertFile("../docs/index.adoc", {
  safe: "unsafe",
  mkdirs: true,
  to_dir: "../generated-docs/",
  attributes: ["copycss", "toc=left"]
});
