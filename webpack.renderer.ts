import path from "path";
import webpack from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import TerserWebpackPlugin from "terser-webpack-plugin";
import { isDevelopment, isProduction, outDir, rendererDir } from "./src/common/vars";
import { libraryTarget, manifestPath } from "./webpack.dll";

export default function (): webpack.Configuration {
  const htmlTemplate = path.resolve(rendererDir, "index.html");
  const sassCommonVars = path.resolve(rendererDir, "components/vars.scss");
  const tsConfigFile = path.resolve("tsconfig.json");

  return {
    target: "electron-renderer",
    mode: isProduction ? "production" : "development",
    devtool: isProduction ? "source-map" : "eval-source-map",
    cache: isDevelopment,
    entry: {
      renderer: path.resolve(rendererDir, "index.tsx"),
      // renderer_vue: path.resolve(rendererDir, "_vue/index.js"),
    },
    output: {
      path: outDir,
      filename: '[name].js',
      chunkFilename: 'chunks/[name].js',
    },
    resolve: {
      extensions: [
        '.js', '.jsx', '.json',
        '.ts', '.tsx', '.vue'
      ]
    },
    optimization: {
      minimize: false,
      minimizer: [
        new TerserWebpackPlugin({
          cache: true,
          parallel: true,
          sourceMap: true,
          extractComments: {
            condition: "some",
            banner: [
              `Lens - The Kubernetes IDE. Copyright ${new Date().getFullYear()} by Lakend Labs, Inc. All rights reserved.`
            ].join("\n")
          }
        })
      ],
    },

    module: {
      rules: [
        {
          test: /\.node$/,
          use: "node-loader"
        },
        {
          test: /\.tsx?$/,
          use: [
            "babel-loader",
            {
              loader: "ts-loader",
              options: {
                // transpileOnly: false,
                // appendTsSuffixTo: [/\.vue$/], // todo: remove after migration vue parts
                configFile: tsConfigFile,
                compilerOptions: {
                  // localization support
                  // https://lingui.js.org/guides/typescript.html
                  jsx: "preserve",
                  target: "es2016",
                },
              }
            }
          ]
        },
        {
          test: /\.(jpg|png|svg|map|ico)$/,
          use: 'file-loader?name=assets/[name]-[hash:6].[ext]'
        },
        {
          test: /\.(ttf|eot|woff2?)$/,
          use: 'file-loader?name=fonts/[name].[ext]'
        },
        {
          test: /\.s?css$/,
          use: [
            isDevelopment ? "style-loader" : MiniCssExtractPlugin.loader,
            {
              loader: "css-loader",
              options: {
                sourceMap: isDevelopment
              },
            },
            {
              loader: "sass-loader",
              options: {
                sourceMap: isDevelopment,
                prependData: `@import "${path.basename(sassCommonVars)}";`,
                sassOptions: {
                  includePaths: [
                    path.dirname(sassCommonVars)
                  ]
                },
              }
            },
          ]
        }
      ]
    },

    plugins: [
      // todo: check if this actually works in mode=production files
      new webpack.DllReferencePlugin({
        context: process.cwd(),
        manifest: manifestPath,
        sourceType: libraryTarget,
      }),

      new HtmlWebpackPlugin({
        template: htmlTemplate,
        inject: true,
      }),
      new MiniCssExtractPlugin({
        filename: "[name].css",
      }),
    ],
  }
}
