'use strict'
const path = require('path')
const webpack = require('webpack')

const config = require('../config')

function resolve (dir) {
  return path.join(__dirname, '..', dir)
}


const webpackConfig = {
  entry: './src/webpack-index.js',
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
        include: [resolve('src')]
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'DEBUG': config.build.debug || false,
      'BASE_URL': config.build.base_url || JSON.stringify('https://api.kloudless.com')
    })
  ]
}

module.exports = webpackConfig