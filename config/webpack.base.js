const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanPlugin } = require('../util');

const outputPath = path.resolve(__dirname, '../dist');

module.exports = {
  entry: {
    background: './src/pages/background/background.js',
    less: './src/pages/background/background.less'
  },
  output: {
    path: outputPath,
    filename: 'js/[name].[hash].js'
  },
  module: {
    rules: [{
      test: /\.less$/,
      use: [
        'style-loader',
        'css-loader',
        'less-loader'
      ]
    }]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].[hash].css',
      chunkFilename: "css/[id].[hash].css"
    }),
    new CleanPlugin(outputPath)
  ]
}
