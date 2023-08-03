const path = require('path');

const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isProduction = process.env.NODE_ENV === 'production';

const mode = isProduction ? 'production' : 'development';

module.exports = {
  mode,
  entry: path.join(__dirname, 'src', 'app.ts'),
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'index.js',
    clean: true,
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp|ico)$/i,
        type: 'asset/inline',
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: path.join(__dirname, 'src', 'html'),
          to: path.join(__dirname, 'dist'),
        },
        {
          from: path.join(__dirname, 'manifest.json'),
          to: path.join(__dirname, 'dist'),
        },
                {
          from: path.join(__dirname, 'src', 'images', 'logos'),
          to: path.join(__dirname, 'dist', 'images'),
        },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: 'index.css',
    }),
  ],
  devtool: 'inline-source-map',
  resolve: {
    extensions: ['.ts'],
  },
};
