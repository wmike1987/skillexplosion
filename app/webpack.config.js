const path = require("path");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        frontdoor: './frontdoor.js',
    },
    optimization: {
        splitChunks: {
          chunks: 'all',
        }
    },
    module: {
      rules: [
          {
              test: /\.(ogg|mp3|wav|mpe?g)$/i,
              include: path.resolve(__dirname, 'Sounds/'),
              use: 'file-loader'
          },
          // {
          //     test: /\.(png|svg|jpg)$/i,
          //     include: path.resolve(__dirname, 'Textures/'),
          //     use: 'file-loader'
          // },
      ]
    },
    resolve: {
        alias: {
          '@core': path.resolve(__dirname, 'Core/'),
          '@utils': path.resolve(__dirname, 'Utils/'),
          '@games': path.resolve(__dirname, 'Games/'),
          '@sounds': path.resolve(__dirname, 'Sounds/'),
          '@textures': path.resolve(__dirname, 'Textures/'),
          '@units': path.resolve(__dirname, '@games/Us/Units'),
          '@lib': path.resolve(__dirname, 'lib')
        }
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
        	  inject: true,
        	  filename: 'index.html',
              template: 'devGameFrame.html',
        	  chunks: ['frontdoor']
        }),
        new CopyPlugin({
            patterns: [
                { from: 'Textures', to: 'Textures/'},
                { from: 'Sounds', to: 'Sounds/'},
                { from: './server.bat', to: ''},
            ]
        })
    ],
    output: {
        filename: '[name].js',
        chunkFilename: '[name].chunk.bundle.js',
        path: path.resolve(__dirname, 'dist'),
    }
};
