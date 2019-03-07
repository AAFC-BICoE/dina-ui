import { exists } from "fs";
import { resolve } from "path";

const mockConvertFile = jest.fn();

jest.mock("asciidoctor.js", () => () => ({
  convertFile: mockConvertFile
}));

describe("build-docs script", () => {
  it("Passes the correct arguments to asciidoctor.", done => {
    const scriptPath = "../build-docs";

    // Run the script.
    require(scriptPath);

    // Check the arguments passed to the mock "convertFile" function.
    expect(mockConvertFile).toBeCalledTimes(1);

    const [convertCall] = mockConvertFile.mock.calls;
    const [inputFilePath, options] = convertCall;

    expect(inputFilePath).toEqual("../docs/index.adoc");
    expect(options).toEqual({
      safe: "unsafe",
      mkdirs: true,
      to_dir: "../generated-docs/",
      attributes: ["copycss", "toc=left"]
    });

    // Expect the input file (index.adoc) to exist at the inputFilePath specified in the script.
    const expectedInputFilePath = resolve(
      __dirname,
      scriptPath,
      "..",
      inputFilePath
    );
    exists(expectedInputFilePath, result => {
      expect(result).toEqual(true);
      done();
    });
  });
});
