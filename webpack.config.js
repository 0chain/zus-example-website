const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");

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
  // optimization: {
  //   minimizer: [
  //     new TerserPlugin(), // Minify JavaScript
  //     new OptimizeCSSAssetsPlugin(), // Minify CSS
  //   ],
  // },
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
  // plugins: [
  //   new MiniCssExtractPlugin({
  //     filename: "[name].css",
  //   }),
  // ],
  devServer: {
    static: path.join(__dirname, "dist"), // Serve content from the 'dist' directory
    port: 9000,
    open: true,
  },
};
