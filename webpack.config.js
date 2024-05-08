const path = require("path");
const WatchFilesPlugin = require("webpack-watch-files-plugin").default;

module.exports = {
  entry: {
    main: "./src/index.js",
    assets: "./src/assets.js",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
  },
  mode: "development",
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
      },
    ],
  },
  plugins: [
    new WatchFilesPlugin({
      files: ["../../lib/js-sdk/dist/*"], // Watch for changes in the 'js-sdk' lib
    }),
  ],
  devServer: {
    static: path.join(__dirname, "dist"),
    port: 9000,
    open: true,
  },
};
