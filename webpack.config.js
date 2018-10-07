const path = require('path');

module.exports = {
  entry: './lib/index.js',
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'id3.js',
    library: 'id3js',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  target: 'node',
  node: {
    fs: 'empty'
  }
};