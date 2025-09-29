# uview-plus 组件使用指南

本文档基于项目中的 uview-plus 官方示例代码整理，用于指导正确使用 uview-plus 组件。

## 重要说明

1. **组件前缀**：使用 `up-` 前缀，如 `up-card`、`up-button`、`up-avatar`
2. **easycom 配置**：项目已配置自动导入，无需手动 import
3. **官方示例位置**：`uview/uview-plus/src/pages/` 目录下有完整示例

## 常用组件使用方法

### 1. up-card 卡片组件

#### 基础用法
```vue
<up-card :showHead="false">
    <template #body>
        <view>卡片内容</view>
    </template>
</up-card>
```

#### 高级用法
```vue
<up-card 
    :title="title"
    :sub-title="subTitle" 
    :thumb="thumb"
    :padding="15"
    :border="true"
    @click="handleClick"
    @head-click="handleHeadClick">
    <template #body>
        <view>主体内容</view>
    </template>
    <template #foot>
        <view>底部内容</view>
    </template>
</up-card>
```

#### 重要属性
- `:showHead` - 是否显示头部（注意驼峰命名）
- `:title` - 标题
- `:sub-title` - 副标题
- `:thumb` - 左上角图片
- `:padding` - 内边距
- `:border` - 是否显示边框

#### 必须使用插槽
- `<template #body>` - 主体内容（必需）
- `<template #foot>` - 底部内容（可选）

### 2. up-avatar 头像组件

#### 基础用法
```vue
<up-avatar :src="avatarUrl"></up-avatar>
```

#### 常用配置
```vue
<up-avatar 
    :src="avatarUrl"
    shape="circle"
    size="160">
</up-avatar>
```

#### 重要属性
- `:src` - 头像图片地址
- `shape` - 形状：`"circle"` 圆形，`"square"` 方形
- `size` - 尺寸，数字或字符串
- `icon` - 图标头像
- `text` - 文字头像
- `randomBgColor` - 随机背景色

#### 示例
```vue
<!-- 图片头像 -->
<up-avatar src="/static/logo.png" size="160" shape="circle" />

<!-- 图标头像 -->
<up-avatar icon="star-fill" fontSize="22" />

<!-- 文字头像 -->
<up-avatar text="U" fontSize="20" randomBgColor />
```

### 3. up-button 按钮组件

#### 基础用法
```vue
<up-button text="按钮文字" @click="handleClick"></up-button>
```

#### 常用配置
```vue
<up-button 
    text="登录"
    type="primary"
    size="normal"
    :loading="loading"
    @click="handleLogin">
</up-button>
```

#### 重要属性
- `text` - 按钮文字
- `type` - 按钮类型：`"primary"`、`"info"`、`"success"`、`"error"`、`"warning"`
- `size` - 尺寸：`"large"`、`"normal"`、`"small"`、`"mini"`
- `:loading` - 加载状态
- `loadingText` - 加载时显示的文字
- `plain` - 镂空按钮
- `hairline` - 细边框
- `:disabled` - 禁用状态
- `icon` - 按钮图标
- `shape` - 形状：`"circle"` 圆形
- `color` - 自定义颜色

#### 示例
```vue
<!-- 基础按钮 -->
<up-button text="默认按钮" type="info" />
<up-button text="主要按钮" type="primary" />
<up-button text="成功按钮" type="success" />

<!-- 镂空按钮 -->
<up-button text="镂空按钮" type="primary" plain />

<!-- 加载按钮 -->
<up-button text="登录中" :loading="true" loadingText="登录中" />

<!-- 自定义颜色 -->
<up-button text="渐变按钮" color="linear-gradient(to right, rgb(66, 83, 216), rgb(213, 51, 186))" />
```

## 常见错误

### 1. 组件前缀错误
❌ 错误：`<u-card>`
✅ 正确：`<up-card>`

### 2. 属性命名错误
❌ 错误：`:show-head="false"`
✅ 正确：`:showHead="false"`

### 3. up-card 结构错误
❌ 错误：
```vue
<up-card>
    <view>直接放内容</view>
</up-card>
```

✅ 正确：
```vue
<up-card>
    <template #body>
        <view>内容必须放在 template #body 中</view>
    </template>
</up-card>
```

### 4. up-button 文字设置错误
❌ 错误：`<up-button>按钮文字</up-button>`
✅ 正确：`<up-button text="按钮文字" />`

## 项目配置

### easycom 配置（已配置）
```json
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^up-(.*)": "uview-plus/components/u-$1/u-$1.vue",
      "u-(.*)": "uview-plus/components/u-$1/u-$1.vue"
    }
  }
}
```

## 参考资源

1. **官方文档**：https://uiadmin.net/uview-plus/
2. **项目示例**：`uview/uview-plus/src/pages/` 目录
3. **组件源码**：`node_modules/uview-plus/components/` 目录

## 使用建议

1. **优先查看官方示例**：在 `uview/uview-plus/src/pages/` 目录下找对应组件的示例
2. **注意属性命名**：使用驼峰命名，如 `showHead` 而不是 `show-head`
3. **必须使用插槽**：up-card 等组件必须使用指定的插槽结构
4. **测试验证**：每次使用新组件时先用简单示例测试
### 4. up-
cell 和 up-cell-group 组件

#### 基础用法
```vue
<up-cell-group>
    <up-cell title="标题" value="内容"></up-cell>
    <up-cell title="标题" value="内容" label="描述信息"></up-cell>
</up-cell-group>
```

#### 带图标的用法
```vue
<up-cell-group>
    <up-cell 
        title="姓名" 
        value="张三" 
        icon="account"
        :isLink="false">
    </up-cell>
    <up-cell 
        title="电话" 
        value="138****8888" 
        icon="phone">
    </up-cell>
</up-cell-group>
```

#### 重要属性
- `title` - 左侧标题
- `value` - 右侧内容
- `label` - 标题下方的描述信息
- `icon` - 左侧图标
- `:isLink` - 是否显示右侧箭头
- `size` - 尺寸：`"large"` 或默认
- `center` - 右侧内容是否垂直居中
- `required` - 是否显示必填星号

#### 自定义插槽
```vue
<up-cell>
    <template #title>
        <view>自定义标题内容</view>
    </template>
    <template #value>
        <text>自定义右侧内容</text>
    </template>
</up-cell>
```