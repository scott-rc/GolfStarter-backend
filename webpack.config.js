const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

const prod = process.env.NODE_ENV === 'production';

const serverConfig = {
  entry: ['babel-polyfill', './src/server.js'],
  stats: 'minimal',
  target: 'node',
  node: {
    __dirname: false,
    __filename: false,
  },
  externals: [nodeExternals()],
  devtool: prod ? 'source-map' : 'inline-source-map',
  performance: {
    hints: false,
  },

  output: {
    path: path.join(__dirname, prod ? 'dist' : 'build'),
    filename: 'golfstarters-server.js',
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        include: [path.resolve(__dirname, 'src')],
        use: [
          { loader: 'babel-loader' },
        ],
      },
    ],
  },

  resolve: {
    extensions: ['*', '.webpack.ts', '.ts', '.js', '.json'],
  },
};

const productionPlugins = [
  new webpack.optimize.UglifyJsPlugin({
    sourceMap: true,
  }),

  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: "'production'",
    },
  }),

  new webpack.LoaderOptionsPlugin({
    minimize: true,
  }),
];

if (prod) {
  serverConfig.plugins = (serverConfig.plugins || []).concat(productionPlugins);
}

module.exports = serverConfig;
