const path = require("path");

module.exports = {
  entry: {
    main: "./src/index.js",
    assets: "./src/assets.js"
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
  },
  mode: "development",
};
