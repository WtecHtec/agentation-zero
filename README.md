
# Agentation Zero 

**零配置、AI 原生的网页反馈与协同工具**

Agentation Zero 是一个专为 AI 辅助编程设计的网页标注工具。它抛弃了复杂的后端服务和数据库依赖，通过 Vite 插件体系提供“开箱即用”的极致体验。

## 🌟 核心特性

- **零配置启动 (Zero-Config)**: 
  自动集成在您的 Vite 开发服务器中，数据直接存储为本地 `annotations.json` 文件。
  
- **团队即时协同 (Instant Team Sync)**:
  内置 Ngrok 支持。一键生成公网 URL，无需部署服务器，即可邀请团队成员在真实设备上共同测试、标注。

- **AI 原生定位 (AI-Native)**:
  自动注入代码位置 (`data-agentation-location`)。AI 能够直接读取到组件的文件路径和行号，实现精准的代码修改，彻底告别脆弱的 CSS Selector。

- **极简架构**:
  无数据库、无额外的 Node 服务进程。一切随 `npm run dev` 自动启动。

## 🚀 快速开始

### 1. 安装

```bash
npm install agentation-zero --save-dev
```

### 2. 配置 Vite 插件

在 `vite.config.ts` 中引入插件：

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import agentationHttp from 'agentation-zero/plugins/http';
import agentationLocator from 'agentation-zero/plugins/locator';
import agentationHtml from 'agentation-zero/plugins/html';

export default defineConfig({
  plugins: [
    react(),
    // 1. 提供 API 服务和数据存储
    agentationHttp({
       // 可选: 启用内网穿透
       // enableNgrok: true 
    }),
    // 2. 注入源码位置信息 (供 AI 使用)
    agentationLocator(),
  ]
});
```

### 3. 启动项目

```bash
npm run dev
```

现在，您的页面右下角会出现 **Agentation Toolbar**。
- 点击 **"添加标注"** 开始圈选。
- 数据会自动保存到项目根目录的 `annotations.json`。

## 🛠️ 高级配置

### 开启公网协同 (Ngrok)

在环境变量中配置 Token，或直接在插件参数中传入：

**方式 A: .env 文件 (推荐)**
```
NGROK_AUTHTOKEN=您的_ngrok_token
```

**方式 B: 插件配置**
```typescript
agentationHttp({
  enableNgrok: true,
  ngrokToken: "您的_ngrok_token"
})
```

启动后，控制台会打印绿色的公网地址：
```
[agentation] 🚀 Public URL: https://e2e4-1-2-3-4.ngrok-free.app
```
将此链接发给同事，他们即可在手机或电脑上访问您的本地开发环境，并进行实时标注协同。

## 📦 项目结构

- **src/client**: 前端 Toolbar UI 代码 (React + TypeScript)
- **src/plugins**: Vite 插件集 (Server, Locator, HTML Injector)
- **dist**: 编译产物

## 🤝 贡献

欢迎提交 Issue 和 PR！让我们一起打造最适合 AI 时代的开发工具。
