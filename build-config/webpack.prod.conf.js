const path = require('path');
const baseWebpackConfig = require('./webpack.base.conf');

const fileName = 'kloudless-authenticator';

function resolve(dir) {
  return path.join(__dirname, '..', dir);
}

const prodBaseWebpackConfig = {
  ...baseWebpackConfig,
  mode: 'production',
};

const libWebpackConfig = {
  ...prodBaseWebpackConfig,
  output: {
    path: resolve('build'),
    filename: `${fileName}.js`,
  },
  optimization: {
    minimize: false,
  },
};

const minLibWebpackConfig = {
  ...prodBaseWebpackConfig,
  output: {
    path: resolve('build'),
    filename: `${fileName}.min.js`,
  },
};

module.exports = [
  libWebpackConfig,
  minLibWebpackConfig,
];
