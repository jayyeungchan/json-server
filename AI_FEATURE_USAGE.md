# OpenAI集成功能使用说明

## 功能概述

本项目已集成OpenAI API功能，可以从TypeScript接口文件自动生成JSON数据。

## 配置步骤

### 1. 配置OpenAI API密钥

编辑 `.env` 文件，添加你的OpenAI API密钥：

```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7
```

### 2. 准备TypeScript接口文件

创建包含接口定义的TypeScript文件，例如 `test-interface.ts`（已提供示例）。

## 使用方法

### 基本用法

```bash
# 使用AI生成JSON数据
node lib/bin.js --ai test-interface.ts db.json

# 或者使用npm script
npm start -- --ai test-interface.ts db.json
```

### 完整测试流程

1. **构建项目**：
   ```bash
   npm run build
   ```

2. **测试AI功能**：
   ```bash
   # 生成测试数据
   node lib/bin.js --ai test-interface.ts test-db.json
   ```

3. **启动服务器**：
   ```bash
   # 使用生成的数据启动服务器
   node lib/bin.js test-db.json
   ```

4. **验证结果**：
   - 打开浏览器访问 `http://localhost:3000`
   - 查看生成的API端点：`/users`, `/products`, `/orders`

## 命令行参数

- `--ai <interface-file>`: 指定TypeScript接口文件，使用OpenAI生成JSON数据
- `--port <port>`: 指定服务器端口（默认3000）
- `--host <host>`: 指定服务器主机（默认localhost）

## 示例接口文件

项目中包含 `test-interface.ts` 示例文件，定义了以下接口：
- `User`: 用户信息
- `Product`: 产品信息  
- `Order`: 订单信息
- `Database`: 数据库结构

## 注意事项

1. 确保有有效的OpenAI API密钥
2. 接口文件必须是有效的TypeScript语法
3. 生成的数据会自动合并到现有JSON文件中
4. 首次使用需要网络连接调用OpenAI API

## 故障排除

- **API密钥错误**：检查 `.env` 文件中的 `OPENAI_API_KEY` 配置
- **接口文件无效**：确保TypeScript接口语法正确
- **网络问题**：检查网络连接和API访问权限