const { resolve, join } = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
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
    devtool: 'inline-source-map',
    entry: entry,
    output: {
        filename: 'js/[name].js',
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
                    filename: 'img/[name][ext]',
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
    plugins: [
        new ESLintPlugin({
            context: resolve(__dirname, "src"),
        }),
        new MiniCssExtractPlugin({
            filename: 'css/[name].css',
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
    devServer: {
        //本地服务
        static: {
            directory: join(__dirname, 'src'),
        },
        compress: true,
        port: 8089,
        hot: 'only',
        host: '127.0.0.1',
        open: false,
        proxy: {
            '/api': {
                target: '',
                changeOrigin: true,
                secure: false,
                pathRewrite: {
                    '^/api': '',
                },
            },
        },
    },
}
