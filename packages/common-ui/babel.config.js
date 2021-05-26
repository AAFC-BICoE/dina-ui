module.exports = function (api) {
  api.cache(true);

  const nextPreset = ["next/babel"];

  const presets = [nextPreset];

  return { presets };
};
