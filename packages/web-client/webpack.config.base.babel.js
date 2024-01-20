import path from 'path';
import webpack from 'webpack';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import process from 'child_process';

import config from './output.json';
import pack from './package.json';

const commitHash = process.execSync('git rev-parse HEAD').toString().trim();

export default {
  target: 'web',
  entry: {
    main: path.join(__dirname, 'src', 'index.js'),
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, '.dist'),
    publicPath: '/',
    clean: true,
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public', 'index.html'),
      filename: 'index.html',
      inject: 'head',
    }),
    new CopyPlugin({
      patterns: [
        path.resolve(__dirname, 'public', 'favicon.ico'),
        path.resolve(__dirname, 'public', 'logo192.png'),
        path.resolve(__dirname, 'public', 'logo512.png'),
        path.resolve(__dirname, 'public', 'manifest.json'),
      ],
    }),
    new webpack.DefinePlugin({
      'process.env': {
        clientId: JSON.stringify(config.mealPlannerClientId),
        userPoolId: JSON.stringify(config.mealPlannerUserPoolId),
        region: JSON.stringify(config.mealPlannerRegion),
        version: JSON.stringify(pack.version),
        commitHash: JSON.stringify(commitHash),
      },
    }),
  ],
  resolve: {
    extensions: ['.mjs', '.js', '.jsx', '.json', '.ts', '.tsx'],
    modules: [path.join(__dirname, 'src'), 'node_modules'],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            rootMode: 'upward',
          },
        },
      },
      /** ==> For all .css files in node_modules */
      {
        test: /\.css$/,
        include: /node_modules/,
        use: [
          'style-loader',
          'css-loader',
          // { loader: 'css-loader', options: { camelCase: true } },
        ],
      },
      /** <== For all .css files in node_modules */
      {
        test: /\.(sa|sc|c)ss$/,
        exclude: /node_modules/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      },
    ],
  },
};
