'use strict'
const path = require('path')
const webpack = require('webpack')

const baseWebpackConfig = require('./webpack.base.conf')
const libraryName = 'Kloudless'
const fileName = 'kloudless-authenticator'

function resolve (dir) {
  return path.join(__dirname, '..', dir)
}

const libWebpackConfig = Object.assign({}, baseWebpackConfig, {
  output: {
    path: resolve('build'),
    filename: fileName + '.js',
    library: libraryName,
    libraryTarget: 'umd',
    libraryExport: 'default',
    umdNamedDefine: true
  }
})

const minLibWebpackConfig = Object.assign({}, baseWebpackConfig, {
  output: {
    path: resolve('build'),
    filename: fileName + '.min.js',
    library: libraryName,
    libraryTarget: 'umd',
    libraryExport: 'default',
    umdNamedDefine: true
  }
})

minLibWebpackConfig.plugins = minLibWebpackConfig.plugins.concat([
  new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false
    },
    parallel: true
  }),
])

module.exports = [
  libWebpackConfig,
  minLibWebpackConfig
]