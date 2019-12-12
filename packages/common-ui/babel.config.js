module.exports = function(api) {
  api.cache(true);

  const nextPreset = ["next/babel"];

  const presets = [nextPreset];

  if (process.env["ENV"] !== "test") {
    nextPreset.push({
      useBuiltIns: "usage",
      targets: { ie: "11" }
    });
  }

  return { presets };
};
