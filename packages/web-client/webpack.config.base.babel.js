import webpack from 'webpack';
import path from 'path';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import process from 'child_process';
import MomentLocalesPlugin from 'moment-locales-webpack-plugin';

import config from './output.json';
import pack from './package.json';

const commitHash = process.execSync('git rev-parse HEAD').toString().trim();

const appDirectory = path.resolve(__dirname, './');

export default {
  target: 'web',
  entry: [path.join(appDirectory, 'src', 'index.web.js')],
  output: {
    filename: '[name].js',
    path: path.join(appDirectory, '.dist'),
    publicPath: '/',
    clean: true,
  },

  module: {
    rules: [
      {
        test: /\.(jpg|png|woff|woff2|eot|ttf|svg|gif|ico)$/,
        type: 'asset/resource',
      },
      {
        test: /\.(js|jsx)$/,
        // Add every directory that needs to be compiled by Babel during the build.
        include: [
          path.resolve(appDirectory, 'src'),
          path.resolve(appDirectory, '..', '..', 'node_modules/react-native-vector-icons'),
          path.resolve(appDirectory, '..', '..', 'node_modules/react-native-web-refresh-control'),
        ],
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            // Re-write paths to import only the modules needed by the app
            plugins: ['react-native-web'],
            rootMode: 'upward',
          },
        },
      },
    ],
  },
  resolve: {
    // This will only alias the exact import "react-native"
    alias: {
      'react-native$': 'react-native-web',
    },
    // If you're working on a multi-platform React Native app, web-specific
    // module implementations should be written in files using the extension
    // `.web.js`.
    extensions: ['.web.js', '.js', '.jsx'],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: path.join(appDirectory, 'public', 'index.html'),
      filename: 'index.html',
      inject: 'head',
    }),
    new CopyPlugin({
      patterns: [
        path.join(appDirectory, 'public', 'favicon.ico'),
        path.join(appDirectory, 'public', 'logo144.png'),
        path.join(appDirectory, 'public', 'logo192.svg'),
        path.join(appDirectory, 'public', 'logo512.svg'),
        path.join(appDirectory, 'public', 'logo1024.svg'),
        path.join(appDirectory, 'public', 'manifest.json'),
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
    new MomentLocalesPlugin({
      localesToKeep: ['fr'],
    }),
  ],
};
