const { resolve, join } = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlMinimizerPlugin = require('html-minimizer-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const ESLintPlugin = require('eslint-webpack-plugin');
const glob = require('glob');

// 复用loader
const commonCssLoader = [
    MiniCssExtractPlugin.loader,
    {
        loader: 'css-loader',
        options: {
            /**
             * https://webpack.docschina.org/loaders/css-loader/#importloaders
             */
            importLoaders: 1,
        },
    },
    {
        loader: 'postcss-loader',
        options: {
            postcssOptions: {
                plugins: [
                    [
                        /**
                         * postcss-loader和MiniCssExtractPlugin.loader一起使用的时候会报错可以使用autoprefixer
                         */
                        require('autoprefixer')({
                            overrideBrowserslist: [
                                'last 2 version',
                                '>1%',
                                'ios 7',
                            ],
                        }),
                        require('postcss-preset-env'),
                    ],
                ],
            },
        },
    },
]

//构建多入口entry和htmlWebpackPlugin的配置
const multiConstructure = () => {
    const entry = {};
    const htmlWebpackPlugin = [];
    const _path = resolve(__dirname, './src');
    const _entryFiles = glob.sync((`${_path}/*/index.{js, jsx}`).replace(/\\/g, '/'));

    Object.keys(_entryFiles).map(index => {
        const filePath = _entryFiles[index];
        const _match = filePath.match(/src\/(.*)\/index\.js/);
        const pageName = _match && _match[1];

        entry[pageName] = filePath;
        htmlWebpackPlugin.push(
            new HtmlWebpackPlugin(
                {
                    template: join(__dirname, `src/${pageName}/index.html`),
                    filename: `${pageName}.html`,
                    chunks: [pageName],
                    inject: true
                }
            )
        )
    })
    return { entry, htmlWebpackPlugin };
}

const { entry, htmlWebpackPlugin } = multiConstructure();

module.exports = {
    /**
     * inline-source-map 只生成一个内联source-map,错误代码准确信息和源代码的错误位置
     * nosources-source-map 错误代码准确信息，但是没有任何源代码信息
     */
    devtool: 'nosources-source-map',
    entry: entry,
    output: {
        filename: 'js/[name].[fullhash].bundle.js',
        path: resolve(__dirname, 'dist'),
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: [...commonCssLoader],
            },
            {
                test: /\.(png|jpe?g|gif|svg)$/,
                /**
                 * 文件打包方式
                 * https://webpack.js.org/guides/asset-modules/
                 */
                type: 'asset/resource',
                generator: {
                    filename: 'img/[hash:10][ext]',
                },
                parser: {
                    dataUrlCondition: {
                        maxSize: 30 * 1024,
                    },
                },
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'font/[hash:10].[ext]',
                },
            },
            {
                test: /\.html$/i,
                loader: 'html-loader',
            },
            {
                test: /\.js$/i,
                exclude: /node_modules/,
                use: {
                    /**
                     * cacheDirectory
                     * https://www.webpackjs.com/loaders/babel-loader/#babel-loader
                     */
                    loader: 'babel-loader?cacheDirectory'
                },
            },
        ],
    },
    optimization: {
        nodeEnv: 'production',
        runtimeChunk: 'single',
        minimizer: [
            /**
             * 配置压缩工具
             * 在 webpack@5 中，你可以使用 `...` 语法来扩展现有的 minimizer（即 `terser-webpack-plugin`），将下一行取消注释
             * TerserPlugin dev模式下注释掉 不然没有console
             */
            //`...`,
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        pure_funcs: ['console.log'],
                    },
                    format: {
                        comments: false,
                    },
                },
                extractComments: false,
            }),
            new HtmlMinimizerPlugin({
                minimizerOptions: {
                    collapseWhitespace: true,
                    removeComments: true,
                },
            }),
            new CssMinimizerPlugin(),
        ],
        splitChunks: {
            chunks: 'all',
        },
    },
    plugins: [
        new ESLintPlugin({
            context: resolve(__dirname, "src"),
        }),
        new MiniCssExtractPlugin({
            filename: 'css/bundle-[fullhash].css',
        })
    ].concat(htmlWebpackPlugin),
    performance: {
        /**
         * 配置性能评估
         * https://webpack.docschina.org/configuration/performance/#root
         */
        // maxAssetSize: 100000,
        // hints: 'error'
    },
    // externals: {
    //     /**
    //      * 可以不打包jquery模块，在html下引入了url
    //      * 然后在js文件用使用import $ from 'jquery'
    //      */
    //     jquery: 'window.$',
    // },
}
