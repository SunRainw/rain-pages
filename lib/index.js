const { src, dest, parallel, series, watch } = require("gulp")
const del = require("del")
const browserSync = require("browser-sync")

const loadPlugins = require('gulp-load-plugins')

const plugins = loadPlugins()
// browserSync提供一个create函数，调用它就会自动创建服务器
const bs = browserSync.create()
const sass = require("gulp-sass")(require("sass"))

// process.cwd()方法会返回当前命令行所在的工作目录
const cwd = process.cwd()
// 载入配置文件，使用let是为了有一些默认的配置
// 添加默认的路径配置
let config = {
  build: {
    src: "src",
    dist: "dist",
    temp: "temp",
    public: "public",
    paths: {
      styles: "assets/styles/*.scss",
      scripts: "assets/scripts/*.js",
      pages: "*.html",
      images: "assets/images/**",
      fonts: "assets/fonts/**"
    }
  }
}
// 使用try catch防止require一个不存在的目录报错
try {
  const loadConfig = require(`${cwd}/pages.config.js`)
  config = Object.assign({}, config, loadConfig)
} catch (e) { }

const clean = () => {
  return del([config.build.dist, config.build.temp])
}
// 样式文件编译
const style = () => {
  // 可以设置cwd，即设置从那个目录下找该文件，默认cwd是项目运行时路径
  return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src })
    .pipe(sass({ outputStyle: 'expanded' }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

// js文件编译
const script = () => {
  return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src })
    // 采用require是因为当前目录下没有@babel/preset-env的包，使用require就会先找当前目录下，没有再找项目根目录下的包
    .pipe(plugins.babel({ presets: [require("@babel/preset-env")] }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

// html文件编译
const page = () => {
  return src(config.build.paths.pages, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.swig({ data: config.data, cache: false }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

// 图片编译
const img = () => {
  return src(config.build.paths.images, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

// 一般字体可以直接复制一遍，有些字体是svg，就可以使用imagemin压缩一次
const font = () => {
  return src(config.build.paths.fonts, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

// 处理public下的文件
const extra = () => {
  return src("**", { base: config.build.public, cwd: config.build.public })
    .pipe(dest(config.build.dist))
}

// 建立开发服务器任务
const serve = () => {
  // 这里也可以传第二个参数配置cwd
  watch(config.build.paths.styles, { cwd: config.build.src }, style)
  watch(config.build.paths.pages, { cwd: config.build.src }, page)
  watch(config.build.paths.scripts, { cwd: config.build.src }, script)
  watch([config.build.paths.images, config.build.paths.fonts], { cwd: config.build.src }, bs.reload)
  watch("**", { cwd: config.build.public }, bs.reload)

  bs.init({ // 初始化服务器
    server: {
      notify: false,
      port: 2080,
      baseDir: [config.build.temp, config.build.src, config.build.public],
      routes: {
        "/node_modules": "node_modules"
      }
    }
  })
}

const useref = () => {
  return src(config.build.paths.pages, { base: config.build.temp, cwd: config.build.temp })
    .pipe(plugins.useref({ searchPath: [config.build.temp, "."] }))
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    // html默认不会压缩空格，需要传入一个对象
    .pipe(plugins.if(/\.html/, plugins.htmlmin({
      collapseWhitespace: true, // 属性collapseWhitespace用于开关是否删除空格回车等符号
      minifyCSS: true, // 用于压缩html中的style标签中的css
      minifyJS: true, // 用于压缩html中的script标签中的js
    })))
    .pipe(dest(config.build.dist))
}
// 转换src下的文件
const compile = parallel(style, page, page)
// 上线前执行的任务
const build = series(clean, parallel(series(compile, useref), img, font, extra))

// 开发阶段的任务
const develop = series(compile, serve)

module.exports = {
  clean,
  build,
  develop
}