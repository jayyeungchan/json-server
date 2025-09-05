# TypeScript Interface to JSON Generator Feature

## 概述

json-server现已支持从TypeScript接口文件自动生成JSON数据，无需手动创建每个字段的示例数据。

## 使用方法

### 基本语法

```bash
json-server --interface <接口文件.ts> <数据文件.json>
# 或简写
json-server -i <接口文件.ts> <数据文件.json>
```

### 示例

1. **创建TypeScript接口文件** (`interfaces.ts`):
```typescript
export interface User {
  id: number
  name: string
  email: string
  age?: number
  isActive: boolean
  createdAt: string
}

export interface Post {
  id: number
  title: string
  content: string
  authorId: number
  tags: string[]
  publishedAt?: string
  isPublished: boolean
}
```

2. **启动json-server并生成数据**:
```bash
json-server -i interfaces.ts db.json
```

3. **生成的JSON数据** (`db.json`):
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "user@example.com",
      "age": 32,
      "isActive": true,
      "createdAt": "2025-09-05T16:53:51.349Z"
    },
    // ... 更多用户数据
  ],
  "posts": [
    {
      "id": 1,
      "title": "Sample Title",
      "content": "This is sample content for the property.",
      "authorId": 365,
      "tags": ["Sample Text", "Sample Text"],
      "isPublished": true
    },
    // ... 更多文章数据
  ]
}
```

## 智能数据生成规则

生成器会根据属性名和类型智能生成合适的示例数据：

### 字符串类型 (string)
- `email` → `user@example.com`
- `name` → `John Doe`  
- `title` → `Sample Title`
- `content` → `This is sample content for the property.`
- `url`, `link` → `https://example.com`
- `phone` → `(555) 123-4567`
- `address` → `123 Main St, City, State 12345`
- `createdAt`, `updatedAt` → ISO日期字符串
- 其他 → `Sample Text`

### 数字类型 (number)
- `age` → 18-67之间的随机数
- `price`, `cost` → 10-109之间的随机数
- `id` → 1-1000之间的随机数
- 其他 → 1-100之间的随机数

### 布尔类型 (boolean)
- `active`, `enabled` → 70%概率为true
- `published`, `visible` → 60%概率为true  
- 其他 → 50%概率为true

### 其他特性
- **可选属性** (`?`): 70%概率会被包含
- **数组类型**: 生成1-3个元素的数组
- **联合类型**: 使用第一个类型生成数据
- **字面量类型**: 使用定义的字面量值

## 数据合并规则

- 如果目标JSON文件不存在，会创建新文件
- 如果JSON文件为空或只包含`{}`，会用生成的数据填充
- 如果JSON文件已有数据，生成的数据会与现有数据合并

## 端点命名规则

接口名会被转换为API端点：
- `User` → `/users`
- `Post` → `/posts` 
- `Comment` → `/comments`

## 完整示例

```bash
# 1. 创建接口文件
cat > blog-interfaces.ts << 'EOF'
export interface User {
  id: number
  name: string
  email: string
  age?: number
  isActive: boolean
}

export interface Post {
  id: number
  title: string
  content: string
  authorId: number
  tags: string[]
  isPublished: boolean
}
EOF

# 2. 启动服务器
json-server -i blog-interfaces.ts blog-db.json

# 3. 访问API
curl http://localhost:3000/users
curl http://localhost:3000/posts
```

这个功能大大简化了mock数据的创建过程，让你可以快速从TypeScript接口定义开始构建RESTful API原型。