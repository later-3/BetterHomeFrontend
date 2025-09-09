# Directus API 交互参考

> **发布功能**的完整后端API交互指南和测试脚本

## 🔧 环境配置

### 基础配置
```bash
# 服务器地址
export BASE_URL="http://localhost:8055"

# 测试账号 (已创建)
export TEST_EMAIL="cunmin@mail.com"
export TEST_PASSWORD="123"
```

### 一次性登录获取Token
```bash
# 登录获取访问令牌
export TOKEN=$(curl -fsS -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
  | jq -r '.data.access_token')

echo "TOKEN: $TOKEN"

# 获取当前用户ID (作为author使用)
export USER_ID=$(curl -fsS "$BASE_URL/users/me" \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.data.id')

echo "USER_ID: $USER_ID"
```

---

## 📋 API接口详情

### 1. 健康检查和认证

#### 服务器信息
```bash
curl -fsS "$BASE_URL/server/info" | jq .
```

#### 验证Token有效性
```bash
curl -fsS "$BASE_URL/users/me" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### 2. 数据字典接口

#### 获取社区列表
```bash
curl -fsS "$BASE_URL/items/communities?fields=id,name&limit=-1" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

**响应格式**:
```json
{
  "data": [
    {
      "id": "uuid-1",
      "name": "绿园小区"
    },
    {
      "id": "uuid-2",
      "name": "蓝天花园"
    }
  ]
}
```

#### 获取楼栋列表 (全部)
```bash
curl -fsS "$BASE_URL/items/buildings?fields=id,name,community_id&limit=-1" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

#### 获取楼栋列表 (按社区过滤)
```bash
# 需要先获取社区ID
COMM_ID="填入实际社区ID"

curl -fsS "$BASE_URL/items/buildings?fields=id,name,community_id&filter[community_id][_eq]=$COMM_ID&limit=-1" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

#### 获取部门列表
```bash
curl -fsS "$BASE_URL/items/departments?fields=id,name&limit=-1" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### 3. 内容发布接口

#### 创建业主圈帖子 (Post)
```bash
# 需要先获取社区ID
COMM_ID="填入实际社区ID"

POST_ID=$(curl -fsS -X POST "$BASE_URL/items/contents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"post\",
    \"title\": \"测试帖子标题\",
    \"body\": \"这是一个测试帖子的内容\",
    \"community_id\": \"$COMM_ID\",
    \"author\": \"$USER_ID\"
  }" | jq -r '.data.id')

echo "创建的帖子ID: $POST_ID"
```

#### 创建投诉内容 (Complaint)
```bash
COMPLAINT_ID=$(curl -fsS -X POST "$BASE_URL/items/contents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"complaint\",
    \"title\": \"电梯故障投诉\",
    \"body\": \"电梯经常故障，影响居民出行\",
    \"community_id\": \"$COMM_ID\",
    \"author\": \"$USER_ID\",
    \"building_id\": \"可选的楼栋ID\",
    \"target_department_id\": \"可选的部门ID\"
  }" | jq -r '.data.id')

echo "创建的投诉ID: $COMPLAINT_ID"
```

#### 创建工单 (WorkOrder)
```bash
# 基于上面创建的投诉内容创建工单
WORKORDER_ID=$(curl -fsS -X POST "$BASE_URL/items/work_orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"content_id\": \"$COMPLAINT_ID\",
    \"status\": \"submitted\",
    \"community_id\": \"$COMM_ID\"
  }" | jq -r '.data.id')

echo "创建的工单ID: $WORKORDER_ID"
```

### 4. 查询详情接口

#### 查询内容详情
```bash
curl -fsS "$BASE_URL/items/contents/$POST_ID?fields=id,type,title,body,date_created,community.name,author.email" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

#### 查询工单详情
```bash
curl -fsS "$BASE_URL/items/work_orders/$WORKORDER_ID?fields=id,status,content_id.title,community.name,date_created" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

#### 查询某内容关联的工单
```bash
curl -fsS "$BASE_URL/items/work_orders?fields=id,status,date_created&filter[content_id][_eq]=$COMPLAINT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## 🔄 完整测试流程脚本

### 端到端测试脚本
```bash
#!/bin/bash

# 设置基础变量
BASE_URL="http://localhost:8055"
TEST_EMAIL="cunmin@mail.com"
TEST_PASSWORD="123"

echo "🚀 开始发布功能端到端测试..."

# 1. 登录获取Token
echo "1️⃣ 登录获取访问令牌..."
TOKEN=$(curl -fsS -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
  | jq -r '.data.access_token')

if [ "$TOKEN" = "null" ]; then
  echo "❌ 登录失败"
  exit 1
fi
echo "✅ 登录成功, Token: ${TOKEN:0:20}..."

# 2. 获取用户ID
echo "2️⃣ 获取当前用户ID..."
USER_ID=$(curl -fsS "$BASE_URL/users/me" \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.data.id')
echo "✅ 用户ID: $USER_ID"

# 3. 获取社区列表
echo "3️⃣ 获取社区列表..."
COMM_ID=$(curl -fsS "$BASE_URL/items/communities?fields=id,name&limit=1" \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.data[0].id')

if [ "$COMM_ID" = "null" ]; then
  echo "❌ 未找到社区数据"
  exit 1
fi
echo "✅ 选择社区ID: $COMM_ID"

# 4. 创建业主圈帖子
echo "4️⃣ 创建业主圈帖子..."
POST_ID=$(curl -fsS -X POST "$BASE_URL/items/contents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"post\",
    \"title\": \"测试帖子-$(date +%H%M%S)\",
    \"body\": \"这是一个自动化测试创建的帖子\",
    \"community_id\": \"$COMM_ID\",
    \"author\": \"$USER_ID\"
  }" | jq -r '.data.id')

if [ "$POST_ID" = "null" ]; then
  echo "❌ 帖子创建失败"
  exit 1
fi
echo "✅ 帖子创建成功, ID: $POST_ID"

# 5. 创建投诉内容
echo "5️⃣ 创建投诉内容..."
COMPLAINT_ID=$(curl -fsS -X POST "$BASE_URL/items/contents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"complaint\",
    \"title\": \"测试投诉-$(date +%H%M%S)\",
    \"body\": \"这是一个自动化测试创建的投诉\",
    \"community_id\": \"$COMM_ID\",
    \"author\": \"$USER_ID\"
  }" | jq -r '.data.id')

if [ "$COMPLAINT_ID" = "null" ]; then
  echo "❌ 投诉创建失败"
  exit 1
fi
echo "✅ 投诉创建成功, ID: $COMPLAINT_ID"

# 6. 创建工单
echo "6️⃣ 创建工单..."
WORKORDER_ID=$(curl -fsS -X POST "$BASE_URL/items/work_orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"content_id\": \"$COMPLAINT_ID\",
    \"status\": \"submitted\",
    \"community_id\": \"$COMM_ID\"
  }" | jq -r '.data.id')

if [ "$WORKORDER_ID" = "null" ]; then
  echo "❌ 工单创建失败"
  exit 1
fi
echo "✅ 工单创建成功, ID: $WORKORDER_ID"

# 7. 验证数据
echo "7️⃣ 验证创建的数据..."

echo "📝 帖子详情:"
curl -fsS "$BASE_URL/items/contents/$POST_ID?fields=id,type,title,community.name" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo "📝 投诉详情:"
curl -fsS "$BASE_URL/items/contents/$COMPLAINT_ID?fields=id,type,title,community.name" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo "📝 工单详情:"
curl -fsS "$BASE_URL/items/work_orders/$WORKORDER_ID?fields=id,status,content_id.title" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo "🎉 端到端测试完成!"
echo "📊 创建结果:"
echo "   帖子ID: $POST_ID"
echo "   投诉ID: $COMPLAINT_ID"
echo "   工单ID: $WORKORDER_ID"
```

### 保存和运行脚本
```bash
# 保存为文件
cat > test-publish-api.sh << 'EOF'
# [上面的脚本内容]
EOF

# 添加执行权限
chmod +x test-publish-api.sh

# 运行测试
./test-publish-api.sh
```

---

## 🚨 错误处理参考

### 常见错误响应格式
```json
{
  "errors": [
    {
      "message": "具体的错误描述",
      "extensions": {
        "code": "FORBIDDEN"
      }
    }
  ]
}
```

### 错误代码处理
```javascript
// 前端错误处理示例
const handleApiError = (error) => {
  if (error.response) {
    const status = error.response.status
    const errorData = error.response.data
    
    if (status === 401) {
      return '登录已过期，请重新登录'
    } else if (status === 403) {
      return '没有操作权限'
    } else if (status === 400 && errorData.errors) {
      return errorData.errors[0].message
    } else if (status >= 500) {
      return '服务器错误，请稍后重试'
    }
  }
  
  return '网络连接失败，请检查网络'
}
```

### 重试机制
```javascript
// 带重试的API调用
const apiCallWithRetry = async (apiCall, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall()
    } catch (error) {
      if (i === maxRetries - 1 || error.response?.status < 500) {
        throw error
      }
      
      // 指数退避
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      )
    }
  }
}
```

---

## 📝 数据模型参考

### Content (内容) 字段
```typescript
interface Content {
  id: string                    // UUID
  type: 'post' | 'complaint'    // 内容类型
  title: string                 // 标题
  body: string                  // 正文内容
  community_id: string          // 所属社区ID
  author: string                // 作者用户ID
  building_id?: string          // 楼栋ID (可选)
  target_department_id?: string // 目标部门ID (可选)
  date_created: string          // 创建时间
  date_updated: string          // 更新时间
  status: string                // 状态
}
```

### WorkOrder (工单) 字段
```typescript
interface WorkOrder {
  id: string              // UUID
  content_id: string      // 关联内容ID
  status: string          // 工单状态: submitted, in_progress, resolved, closed
  community_id: string    // 所属社区ID
  staff_id?: string       // 处理人员ID (可选)
  date_created: string    // 创建时间
  date_updated: string    // 更新时间
}
```

### 关联查询示例
```bash
# 查询投诉及其工单状态
curl -fsS "$BASE_URL/items/contents?fields=id,title,type,work_orders.id,work_orders.status&filter[type][_eq]=complaint" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

**最后更新**: 2025-01-07
**测试账号**: `cunmin@mail.com` / `123`
**服务器地址**: `http://localhost:8055`

💡 **提醒**: 所有API调用都必须携带 `Authorization: Bearer <token>` 头部！