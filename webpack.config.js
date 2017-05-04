const path = require('path');
const webpack = require('webpack');

module.exports = {
  context: path.join(__dirname, 'testClient'),
  entry: {
    app: './index.js',
  },
  output: {
    path: path.join(__dirname, 'testClient'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: [
            ["es2015", { "modules": false }],
            "react"
          ],
        },
      },
      { // begin scss
        test: /\.scss$/,
        loaders: ['style-loader', 'css-loader', 'sass-loader'],
      }, // end scss
      {
        test: /\.(png|jpg)$/,
        loader: 'url-loader',
      },
    ],
  },
};
