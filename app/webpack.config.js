const path = require("path");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        init: './init.js',
        simpleTargets: './Games/Simple_Target.js',
        commonGameStarter: './Core/CommonGameStarter.js'
    },
    module: {
      rules: [
          {
              test: /\.(ogg|mp3|wav|mpe?g)$/i,
              include: path.resolve(__dirname, 'Sounds/'),
              use: 'file-loader'
          },
          {
              test: /\.(png|svg|jpg)$/i,
              include: path.resolve(__dirname, 'Textures/'),
              use: 'file-loader'
          },
      ]
    },
    resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'Core/'),
      '@utils': path.resolve(__dirname, 'Utils/'),
      '@games': path.resolve(__dirname, 'Games/'),
      '@sounds': path.resolve(__dirname, 'Sounds/'),
      '@textures': path.resolve(__dirname, 'Textures/')
    }
    },
    plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
    	  inject: true,
    	  filename: 'index.html',
          template: 'devGameFrame.html',
    	  chunks: ['init']
    }),
    new CopyPlugin({
        patterns: [
            { from: 'Textures', to: 'Textures/'},
        ]
    })
    ],
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
    }
};
