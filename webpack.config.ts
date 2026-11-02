import path from "node:path";
import { fileURLToPath } from "url";
import { execSync } from "node:child_process";
import webpack from "webpack";

import "webpack-dev-server";
import WebpackFavicons from "webpack-favicons";
import pkginfo from "./package.json" with {type: "json"};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = (env: any, argv: {mode?: webpack.Configuration["mode"]}): webpack.Configuration => {

  const MODE = argv?.mode ? argv.mode : "development";

  return {
    entry: "./src/init.ts",
    mode: MODE,
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    output: {
      filename: "storm.js",
      path: path.resolve(__dirname, "dist"),
    },
    devtool: "eval-source-map",
    devServer: {
      static: {
        directory: __dirname,
      },
    },
    plugins: [
      new WebpackFavicons({
        src: "favicon.svg",
        icons: {
          favicons: true
        }
      }),
      new webpack.DefinePlugin({
        PRODUCTION: JSON.stringify(MODE == "production"),
        VERSION: JSON.stringify(pkginfo.version),
        BUILD: JSON.stringify(
          "Build: v" + pkginfo.version + 
          " (" + MODE + ") from " + 
          execSync("git rev-parse --short HEAD").toString('utf-8').trim() + 
          " at " + (new Date()).toISOString()
        )
      }),
    ]
  }
};

export default config;