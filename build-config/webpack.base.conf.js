const path = require('path');

function resolve(dir) {
  return path.join(__dirname, '..', dir);
}

const webpackConfig = {
  entry: './src/browser/webpack-index.js',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'eslint-loader',
        enforce: 'pre',
        include: [resolve('src'), resolve('test')],
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [resolve('src')],
      },
    ],
  },
};

module.exports = webpackConfig;
