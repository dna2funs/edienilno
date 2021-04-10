const path = require('path');

module.exports = {
  target: 'node',
  entry: './server/index.js',
  optimization: {
    minimize: true,
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
