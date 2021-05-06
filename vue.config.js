const path = require("path")
module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '' : '', // 基本路径
  assetsDir: 'static', // 静态路径存放位置
  outputDir: "dist", //打包时生成的生产环境构建文件的目录
  productionSourceMap: false, // 打包时不保留 map 文件（有 map 文件可以知道代码报错位置）
  configureWebpack: config => {
    Object.assign(config, {
      resolve: {
        extensions: [".js", ".vue", ".json", ".css"], //文件优先解析后缀名顺序
        // 别名配置
        alias: {
          "@": path.resolve(__dirname, "./src")
        },
        plugins: []
      }
    });
  },
  devServer: {
    open: true, // 自动打开浏览器
    host: "localhost",
    port: 8080,
    https: false,
    hotOnly: false,
    // proxy: {
    //     '/': {
    //         target: '',
    //         changeOrigin: true,
    //         pathRewrite: {
    //             '^/': ''
    //         }
    //     }
    // }
  }
}