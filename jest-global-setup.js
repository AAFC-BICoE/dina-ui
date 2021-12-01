module.exports = async () => {
  // Make sure tests always run using the same timezone:
  process.env.TZ = "UTC";
};
