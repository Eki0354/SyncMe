const baseConfig = require('./webpack.base');

module.exports = {
  ...baseConfig,
  mode: 'development',
  watch: true,
  watchOptions: {
    ignored: /node_modules|dist/,
  }
}
