const path = require('path');

module.exports = {
  entry: './lib/index.js',
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'id3.js',
    libraryTarget: 'umd',
    library: 'id3'
  },
  node: {
    fs: 'empty'
  }
};