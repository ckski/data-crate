const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
 
module.exports = {
  'entry': [
    'react-hot-loader/patch',
    './src/index.js'
  ],
  'module': {
    'rules': [
      {
        'test': /\.html$/,
        'use': 'html-loader'
      },
      {
        'test': /\.css$/,
        'use': ['style-loader', 'css-loader']
      },
      {
        'test': /\.js$/,
        'exclude': /node_modules/,
        'use': [
          {
            'loader': 'babel-loader',
            'options': {
              'plugins': ['lodash'],
              'presets': [['env', { 'modules': false, 'targets': { 'node': 10 } }]]
            }
          }
        ],
      }
    ]
  },
  'resolve': {
    'extensions': ['*', '.js', '.jsx']
  },
  'output': {
    'filename': 'bundle.js',
    'path': __dirname + '/build',
    'publicPath': '/'
  },
  'plugins': [
    new webpack.HotModuleReplacementPlugin(),
    new LodashModuleReplacementPlugin(),
    new HtmlWebPackPlugin({
          'template': "./src/index.html",
          'filename': "./index.html"
        })
  ],
  'devServer': {
    'contentBase': __dirname + '/public',
    'hot': true
  }
};