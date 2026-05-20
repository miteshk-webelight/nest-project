const path = require('path');
const nodeExternals = require('webpack-node-externals');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  entry: './src/main.ts', // your NestJS app entry point
  target: 'node', // since this is server-side code
  externals: [nodeExternals()], // exclude node_modules from bundle
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      src: path.resolve(__dirname, 'src'),
    },
  },
  output: {
    filename: 'main.js', // output file
    path: path.resolve(__dirname, 'dist'),
  },
  optimization: {
  minimize: false,
    splitChunks: {
      chunks: 'all', // Enable chunk splitting
    },
  },
  mode: 'production', // or 'development' as needed

 plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static', // or 'server' for interactive mode
      openAnalyzer: false,     // automatically opens the report in browser
      reportFilename: 'bundle-report.html',
    }),
  ],
};
