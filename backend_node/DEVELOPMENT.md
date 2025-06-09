# 开发环境指南

本项目提供了多种开发和调试方式，适合不同的开发需求。

## 开发脚本

### 1. 基础开发模式

```bash
# 使用 tsx watch (推荐，速度快)
pnpm run dev

# 使用 nodemon + tsx (功能更丰富)
pnpm run dev:nodemon

# 直接使用 ts-node (基础模式)
pnpm run dev:ts-node
```

### 2. 调试模式

```bash
# 启动调试服务器 (端口 9229)
pnpm run dev:debug

# 直接调试模式
pnpm run debug
```

### 3. 生产模式

```bash
# 构建项目
pnpm run build

# 启动生产服务器
pnpm run start
```

## 开发工具配置

### Nodemon 配置

项目包含两个 nodemon 配置文件：

- `nodemon.json` - 普通开发模式
- `nodemon.debug.json` - 调试模式

### VS Code 调试配置

项目包含 `.vscode/launch.json` 配置，提供两种调试方式：

1. **Debug TypeScript App** - 直接调试
2. **Debug with Nodemon** - 附加到 nodemon 进程调试

## 热重载功能

所有开发模式都支持热重载：

- 监听 `src/` 目录下的 `.ts`, `.js`, `.json` 文件
- 忽略测试文件和构建输出
- 文件变化后自动重启服务器
- 1秒延迟重启，避免频繁重启

## 环境变量

开发模式会自动设置：
- `NODE_ENV=development`
- 调试模式额外设置 `DEBUG=*`

## 端口配置

- 应用服务器：`8000` (可通过 PORT 环境变量修改)
- 调试端口：`9229`

## 使用建议

### 日常开发
推荐使用 `pnpm run dev`，速度最快，功能够用。

### 需要详细日志
使用 `pnpm run dev:nodemon`，可以看到更详细的文件监听信息。

### 调试代码
使用 `pnpm run dev:debug` 启动调试服务器，然后：
1. 在 VS Code 中按 F5 选择 "Debug with Nodemon"
2. 或者在 Chrome 中打开 `chrome://inspect`

### 性能测试
使用 `pnpm run build && pnpm run start` 测试生产环境性能。

## 故障排除

### 端口被占用
```bash
# 查找占用端口的进程
lsof -i :8000

# 杀死进程
kill -9 <PID>
```

### 模块解析错误
确保所有导入使用 `.js` 扩展名（TypeScript ESM 要求）。

### 调试器无法连接
确保调试端口 9229 没有被其他进程占用。
