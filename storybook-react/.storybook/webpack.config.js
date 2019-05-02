const path = require('path');

module.exports = async ({config})=>{
  /**
   * Extend webpack config:
   * Make babel-loader parse JSX in the parent folder.
   */
  config.module.rules.push({
    test: /\.jsx?$/,
    include: path.resolve(__dirname, '..', '..'),
    exclude: /node_modules/,
    use: {
      loader: 'babel-loader',
    }
  });
  return config;
};