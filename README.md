#### SyncMe



##### 简介

自动化打包chrome extention项目，自动关联文件路径到主程序配置，对关键代码进行混淆压缩（待开发），优化项目目录结构，有助于快速开发功能复杂的扩展程序。



##### 目录说明

----项目根目录

----index.js 打包主程序代码

----src 扩展项目目录

------manifest.json 扩展主配置文件，部分项为自动生成，不允许手动配置，请参考[选项](#manifest选项)

------icons 图标目录，仅支持ico格式图标，且名称是支持的大小，如48.ico，建议使用标准大小[16, 48, 128]

------pages 扩展模块目录

--------background 原扩展后台模块

--------\[xxx\] 其他模块

----------\[xxx.js\] 主程序文件
----------\[xxx.json\] 模块配置文件，主要可配置加载时机等
----------\[xxx.(less|css)\] 模块加载的样式文件
----------其他引用的js和样式文件可在以上主文件中使用import/@import等语法导入



#### 快速上手

+ 全局安装脚手架

```
npm install e-syncme-cli -g
```

+ 新建项目

```
syncme create
```

或者参考[手动搭建SyncMe框架](#手动搭建SyncMe框架项目)

+ 运行项目

```
syncme start
<!-- 或者在脚手架项目中 -->
npm run start
```

+ 构建项目生产版本

```
syncme build
<!-- 或者在脚手架项目中 -->
npm run build
```



##### 手动搭建SyncMe框架项目

+ 安装依赖包

```
npm install e-syncme -save--dev
```

+ 运行项目

```
gulp --watch
```

+ 打包项目生产版本

```
gulp
```

**建议在项目package.json中添加命令，使用npm run xxx运行**



##### 项目内命令

+ 创建模块

```
syncme m -c [name]
```

会以脚手架模板文件为基础，在项目根目录/src/pages下创建一个新的模块。
若键入名称为background，则按照background模块创建。
若指定位置已存在模块同名文件夹，则命令无效。

+ 删除模块

```
syncme m -d [name]
```

在项目根目录/src/pages下删除匹配name的模块文件夹。
若文件夹不存在，则会抛出错误。

+ 重命名模块

```
syncme m -r [oldname] [newname]
```

模块名称仅可包含英文字母、数字和下划线，并且以英文字母开头。
