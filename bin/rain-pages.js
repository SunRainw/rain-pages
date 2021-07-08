#!/usr/bin/env node
// cli入口文件，必须添加上诉声明，mac上修改权限为755

// process.argv就是执行命令行的字段，前两个是固定的，一个表示node的bin下的node执行文件所在位置，第二个是当前link文件的路径
// 第三个开始就是传入的内容，截取以空格隔开，所以我们可以push一些命令进去，用来代替在命令行输入

process.argv.push("--cwd")
process.argv.push(process.cwd()) // 这里指定执行任务的目录为当前工作目录
process.argv.push("--gulpfile")
// require是载入这个模块，resolve是找到这个模块所对应的路径，这里传递相对路径
// 此处可以传递一个..，它会自动去找package.json下的main字段对应的路径（与直接输入一致）
process.argv.push(require.resolve(".."))

// 这里只需要让gulp运行起来就行，因此需要引入gulp/bin/gulp，其实它内部就是require("gulp-cli")()
require("gulp/bin/gulp")