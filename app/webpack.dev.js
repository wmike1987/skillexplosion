const path = require("path");
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        headers: {
            'Cache-Control': 'max-age=5',
        },
    },
    stats: {
        warningsFilter: [
            /was not found in 'pixi.js'/
        ]
    }
});
