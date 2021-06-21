const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const baseConfig = require('./webpack.base');

module.exports = {
  ...baseConfig,
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [new UglifyJsPlugin({
      uglifyOptions: {
        annotations: false
      }
    })]
  }
}
