---
title: webpack资料总结 
date: "2021-04-01"
tags: webpack
categories: webpack
---

## webpack基础

* 模块打包 将不同模块的文件整合在一起,保证引用顺序正确
* 编译兼容 通过loader可以实现polyfill
* 能力扩展 通过plugin扩展模块打包和编译兼容的能力

## webpack打包流程  

### 初始化阶段
* 读取合并配置参数
* 创建Compiler对象/加载插件,准备开始编译
### 编译阶段
* 确定入口 根据entry配置找到入口文件,构建依赖图谱
* 模块路径解析 解析模块路径
* 构建模块 通过loader加载文件解析模块内容并且收集模块依赖
### 生成阶段
* 确定输出内容 根据依赖图提取模块- 根据entry 和 optimization配置决定分组 分割策略
* 优化  代码分割 压缩混淆等等
* 生成资源 生成最终的chunk source map等
* 构建资源映射表 包含所有资源的路径清单 用于异步加载

## compiler && compilation
webpack在启动后会创建一个单例的Compiler对象,它负责存储webpack所有配置信息、插件以及声明周期钩子函数
compilation对象是每一次构建的上下文对象,包含当次构建的所有信息

## Loader
loader可以将不同类型的文件转换成JavaScript模块
webpack只能处理js模块代码,Loader可以将非js文件类型的文件转化成js进行后续的打包逻辑

### Loader的执行顺序

Loader是通过数组进行配置的,loader-runner会从配置的末尾依次执行对应loader的处理逻辑(compose)
[a,b,c]
a pitch => b pitch => c pitch =>  c loader normal execution => b loader normal execution => a loader normal execution
[a,b,c] 如果b loader的pitch返回了结果
a pitch => b pitch => a loader normal execution

1. pitch能对loader进行顺序调整
2. loader协同工作
3. 请求重写 pitch可以返回新的请求，从而修改模块的请求
4. 支持异步 

### Loader开发
* this.callback 一个可以同步或者异步调用的可以返回多个结果的函数

      this.callback(
        err: Error | null,
        content: string | Buffer,
        sourceMap?: SourceMap,
        meta?: any
      );

* this.async 告知loader-runner这个loader将会异步回调返回this.callback

#### 同步loader

    // content 
    module.exports = function(content, map, meta) { 
      return someDealFunc(content) // 直接返回同步执行逻辑 同步loader会阻塞webpack编译
    }
    module.exports = function(content, map, meta) {
      // 通过callback触发
      this.callback(null, someDealFunc(content), map, meta)
      // 需要这个return 显示的返回undefined 
      return 
    }
#### 异步loader

    module.exports = function(content, map, meta) {
    // 告知loader-runner是一个异步loader 异步loader不会阻塞webpack编译
      const callback = this.async();
      someAsyncOperation(content, function(err, result) {
        if (err) return callback(err);
        callback(null, result, map, meta);
      });
    };

## Plugin
Plugin主要职责 基于webpack构建的hooks来增强构建能力

### 开发plugin
* 插件必须是一个函数或者一个包含apply方法的对象
* 传递给插件的compiler和compilation对象是同一个引用,修改对应的对象会对后面的插件有影响
* 异步事件需要插件调用回调函数通知webpack进入下一个流程(会阻塞)

      // 同步钩子
      class MyPlugin {
        apply (compiler) {
          // 找到合适的事件钩子，实现自己的插件功能
          compiler.hooks.emit.tap('MyPlugin', compilation => {
              // compilation: 当前打包构建流程的上下文
              console.log(compilation);
              // do something...
          })
        }
      }
      // 异步钩子
      class MyPlugin {
        apply (compiler) {
          // 找到合适的事件钩子，实现自己的插件功能
          compiler.hooks.run.tapAsync('MyPlugin', (compilation, callback) => {
              // compilation: 当前打包构建流程的上下文
              console.log(compilation);
              // 这里调用这个callback 表示这个异步操作结束了
              callback()
          })
          compiler.hooks.run.tapPromise('MyPlugin', (compilation) => {
          // compilation: 当前打包构建流程的上下文
          return new Promise((resolve, reject) => {
            resolve(11)
          })
      })
        }
      }


## webpack性能优化
### 优化构建速度
缓存机制：利用 cache 选项或 cache-loader 插件来缓存构建过程中生成的中间文件，加快后续构建速度。
并行编译：使用 thread-loader 或者 Webpack 自身的多线程能力加速资源处理。  
文件查找优化:  resolve.modules(指定模块解析路径)/resolve.alias(别名)/resolve.extensions(扩展名尝试)/noParse(不解析特定的文件)
### 打包体积性能优化  
Tree Shaking: 去除无用的代码
按需加载Polyfills: 按需加载polyfills
三方库: 单独拆分或者CDN引入
代码分割: optimization.splitChunks 
环境变量: definePlugin

## webpack的热更新原理
在浏览器和与Webpack Dev Server之间维护了一个Websocket，在监听模式下,资源变化Dev Server会向浏览器推送更新(包括构建的hash值)，浏览器完成更新资源的替换

##  文件指纹
* Hash 整个项目的构建相关， 只要项目文件有修改整个项目的hash值就会有变化
* ChunkHash 与chunk有关 不同entry生成不同的chunk
* ContentHash 根据文件内容确定

## webpack的path

* output.publicPath
用户配置打包结果资源引用的位置

* output.path
影响生成文件存放的目录和引用 比如path设置path.resolve(__dirname, 'dist') 在html中引用的时候要使用'dist/bundle.js'

* devServer publicPath
在开发模式下，通过webpack-dev-server启动一个本地服务器，在内存中动态打包文件，用于控制开发模式下的资源访问，默认'/'

## 打包工具对比
大型项目和企业级应用：选择 Webpack，因为它的高度可配置性和强大的插件生态系统可以满足复杂的需求。
快速原型开发和中小型项目：选择 Parcel，因为它的零配置和自动优化特性可以显著提高开发效率。
库开发和中小型项目：选择 Rollup，因为它的简洁配置和优秀的 Tree Shaking 支持可以有效减小打包体积。

| 特性           | Webpack                | Parcel                           | Rollup                        |
| -------------- | ---------------------- | -------------------------------- | ----------------------------- |
| 配置复杂度     | 高                     | 低                               | 中等                          |
| 性能           | 中等                   | 高                               | 高                            |
| 适用场景       | 大型项目、企业级应用   | 快速原型开发、中小型项目         | 库开发、中小型项目            |
| 模块化支持     | 支持多种模块格式       | 支持多种模块格式                 | 支持多种模块格式              |
| 插件系统       | 丰富                   | 丰富                             | 丰富                          |
| HMR            | 支持                   | 支持                             | 支持                          |
| 代码分割       | 支持                   | 支持                             | 支持                          |
| Tree Shaking   | 支持                   | 支持                             | 优秀                          |
| 多语言支持     | 支持                   | 支持                      | 支持  
## webpack中chunk的概念
chunk是由多个模块组成的代码块，比如Entry chunk,Split chunk拆分出的代码等

## sourceMap
//# sourceMappingURL=xxx.js.map
 浏览器会通过sourceURL获取映射文件,通过解析器解析后实现源码和混淆代码之间的映射.

线上环境会通过做域名的限制来避免外网访问

## webpack tree shaking的原理

Tree Shaking指在打包过程中通过静态分析的方式识别和删除没有使用过的代码，以减少最终文件的打包体积

* 识别未使用的代码  webpack会遍历整个模块依赖图，标记模块的导出和引用，并将这些信息保存到内存中
* 标记未使用的代码  通过静态分析的方式确定哪些代码没有被引用，对于没有使用的代码webpack会标记为'未使用'
* 删除未使用的代码  在打包阶段 webpack会根据标记阶段的结果，将标记为'未使用'的代码从打包的结果中删除


## webpackBootstrap 启动文件的格式


/******/ (() => { // webpackBootstrap
          // 模块的定义逻辑
/******/   var __webpack_modules__ = ({
/******/     "./src/moduleA.js":
/******/       ((__unused_webpack_module, exports) => {
/******/         exports.foo = function() {
/******/           return 'Hello from moduleA';
/******/         };
/******/       })
/******/   });
/******/
/******/   var __webpack_module_cache__ = {};
           // 指定模块加载逻辑
/******/   function __webpack_require__(moduleId) {
/******/     // Check if module is in cache
/******/     if(__webpack_module_cache__[moduleId]) {
/******/       return __webpack_module_cache__[moduleId].exports;
/******/     }
/******/     // Create a new module (and put it into the cache)
/******/     var module = __webpack_module_cache__[moduleId] = {
/******/       exports: {}
/******/     };
/******/     // Execute the module function
/******/     __webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/     // Return the exports of the module
/******/     return module.exports;
/******/   }
/******/   // Load entry module and return exports
           // 模块启动
/******/   var __webpack_exports__ = __webpack_require__("./src/index.js");
/******/   // ...
/******/ })()



## 相关文章
[webpack源码解读](https://juejin.cn/post/6844903987129352206)  
[dive into webpack](https://github.com/lihongxun945/diving-into-webpack)  
[当面试官问Webpack的时候他想知道什么](https://juejin.cn/post/6943468761575849992)  
[三十分钟掌握Webpack性能优化](https://juejin.cn/post/6844903651291447309)  
[吐血整理」再来一打Webpack面试题](https://juejin.cn/post/6844904094281236487)




    