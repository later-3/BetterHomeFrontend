# Pinia + pinia-plugin-persist-uni 用户状态持久化

## Core Features

- 基础状态结构设计

- 基础状态操作功能

- Profile页面状态集成

- 持久化配置

- 注册页面状态集成

- 邻居页面状态集成

- 事项页面状态集成

## Tech Stack

{
  "Web": {
    "arch": "vue",
    "component": null
  },
  "iOS": "uni-app 运行时（H5 打包/小程序容器）",
  "Android": "uni-app 运行时（H5 打包/小程序容器）"
}

## Design

使用 Pinia 标准实践，集中式插件配置，strategies 格式持久化，uni-app 存储API，响应式状态管理，统一的用户状态显示UI

## Plan

Note: 

- [ ] is holding
- [/] is doing
- [X] is done

---

[X] 第1步：基础状态结构设计 - 设计最简单的用户状态结构

[X] 第2步：基础状态操作功能 - 添加设置和清除状态的 action

[X] 第3步：Profile页面状态集成 - Profile页面能根据状态显示不同UI

[X] 第4步：添加持久化配置 - 状态能够持久化保存

[X] 第5步：注册页面状态集成 - 注册成功后自动更新状态

[X] 第6步：邻居页面状态集成 - 根据登录状态自动获取内容

[X] 第7步：事项页面状态集成 - task页面集成用户状态显示和条件性UI
