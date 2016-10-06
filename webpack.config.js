var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: [
    path.join(__dirname, 'src', 'index')
  ],
  output: {
    filename: path.join(__dirname, 'index.js')
  },
  module: {
    loaders: [{
      tests: /\.js?$/,
      loaders: ['babel'],
      include: path.join(__dirname, 'src')
    }]
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  }
};

