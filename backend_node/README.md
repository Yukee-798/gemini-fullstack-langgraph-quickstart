# LangGraph Agent Backend (TypeScript)

这是 LangGraph Agent 的 TypeScript 后端实现，从 JavaScript 版本重构而来。

## 功能特性

- 基于 LangGraph 的 AI 代理
- 使用 Google Gemini 作为 LLM
- Express.js REST API
- 模块化的代理架构
- 环境变量配置
- 完整的 TypeScript 支持
- 严格的类型安全

## 技术栈

- **Node.js** (>= 18.0.0)
- **TypeScript** (^5.3.3)
- **Express.js** - Web 框架
- **LangChain.js** - AI 框架
- **LangGraph** - 工作流编排
- **Google Generative AI** - LLM 服务
- **Winston** - 日志记录
- **Zod** - 运行时类型验证
- **ESLint** + **Prettier** - 代码质量
- **Jest** - 测试框架

## 安装

```bash
# 安装依赖
npm install

# 或使用 yarn
yarn install

# 或使用 pnpm
pnpm install
```

## 配置

创建 `.env` 文件并添加以下环境变量：

```env
# Google AI API Key (必需)
GOOGLE_API_KEY=your_google_api_key_here

# Server Configuration
PORT=8000
NODE_ENV=development

# Agent Models Configuration
QUERY_GENERATOR_MODEL=gemini-2.0-flash
REFLECTION_MODEL=gemini-2.5-flash-preview-04-17
ANSWER_MODEL=gemini-2.5-pro-preview-05-06

# Agent Behavior
NUMBER_OF_INITIAL_QUERIES=3
MAX_RESEARCH_LOOPS=2

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
```

## 运行

### 开发模式

```bash
# TypeScript 热重载开发
npm run dev
```

### 生产模式

```bash
# 构建项目
npm run build

# 运行生产版本
npm start
```

### 其他命令

```bash
# 类型检查
npm run type-check

# 代码检查
npm run lint

# 代码格式化
npm run format

# 运行测试
npm test

# 清理构建文件
npm run clean
```

## 项目结构

```
backend_node/
├── src/
│   ├── types/              # TypeScript 类型定义
│   │   └── index.ts        # 核心类型接口
│   ├── agent/              # AI 代理相关代码
│   │   ├── graph.ts        # LangGraph 图定义
│   │   ├── nodes.ts        # 图节点实现
│   │   ├── state.ts        # 状态管理
│   │   ├── tools.ts        # 工具函数和模式
│   │   ├── utils.ts        # 工具函数
│   │   └── prompts.ts      # 提示词模板
│   ├── api/                # API 路由
│   │   └── routes.ts       # Express 路由定义
│   ├── config/             # 配置文件
│   │   └── index.ts        # 环境配置
│   ├── utils/              # 工具函数
│   │   └── logger.ts       # 日志工具
│   └── index.ts            # 应用入口
├── dist/                   # 编译输出目录
├── tests/                  # 测试文件
├── .env.example            # 环境变量示例
├── .eslintrc.js            # ESLint 配置
├── .prettierrc             # Prettier 配置
├── jest.config.js          # Jest 测试配置
├── tsconfig.json           # TypeScript 配置
├── .gitignore
├── package.json
└── README.md
```

## API 端点

### 健康检查

```http
GET /api/health
```

**响应:**
```json
{
  "status": "ok",
  "service": "langgraph-agent",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 代理交互

```http
POST /api/agent/invoke
Content-Type: application/json

{
  "input": "你的问题或指令",
  "config": {
    "configurable": {
      "thread_id": "unique-thread-id"
    }
  }
}
```

**响应:**
```json
{
  "output": "代理的回答",
  "sources": [
    {
      "label": "来源标题",
      "shortUrl": "短链接",
      "value": "原始URL"
    }
  ],
  "metadata": {
    "messageCount": 2,
    "researchLoopCount": 1,
    "searchQueries": ["搜索查询1", "搜索查询2"]
  }
}
```

### 流式响应

```http
POST /api/agent/stream
Content-Type: application/json

{
  "input": "你的问题或指令",
  "config": {
    "configurable": {
      "thread_id": "unique-thread-id"
    }
  }
}
```

### 配置信息

```http
GET /api/agent/config
```

## 类型安全

项目使用 TypeScript 提供完整的类型安全保障：

- **接口定义**: 所有状态、配置和 API 请求/响应都有明确的类型定义
- **严格模式**: 启用了 TypeScript 的严格类型检查
- **运行时验证**: 使用 Zod 进行 API 输入验证
- **类型推导**: 充分利用 TypeScript 的类型推导能力

## 开发

### 代码风格

```bash
# 检查代码风格
npm run lint

# 自动修复代码风格问题
npm run lint -- --fix

# 格式化代码
npm run format
```

### 测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm test -- --coverage
```

### 调试

推荐使用 VS Code 进行调试，项目已配置相应的 TypeScript 支持。

## 构建和部署

```bash
# 构建生产版本
npm run build

# 清理构建文件
npm run clean

# 重新构建
npm run clean && npm run build
```

构建后的文件在 `dist/` 目录中，可以直接部署到生产环境。

## Docker 支持

```bash
# 构建 Docker 镜像
make docker-build

# 运行 Docker 容器
make docker-run
```

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 从 JavaScript 迁移

此版本从原始的 JavaScript 实现重构而来，主要改进包括：

1. **完整的 TypeScript 支持** - 提供编译时类型检查
2. **改进的错误处理** - 更好的错误类型定义和处理
3. **增强的开发体验** - IDE 智能提示和自动完成
4. **更好的代码组织** - 清晰的类型定义和模块结构
5. **现代化工具链** - ESLint、Prettier、Jest 等