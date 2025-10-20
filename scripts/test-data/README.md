# 财务测试数据生成与导入

基于JSON配置的财务测试数据生成系统，支持本地和远程Directus环境。

## 📁 文件说明

```
test-data/
├── billing-config.json           # 配置文件（定义测试数据规则）
├── generate-billing-data.js      # 数据生成脚本
├── import-billing-data.js        # 数据导入脚本
├── billing-data-generated.json   # 生成的数据文件（自动生成）
└── README.md                     # 本文档
```

## 🚀 快速开始

### 1. 生成测试数据

```bash
# 为本地Directus生成数据
node generate-billing-data.js local

# 为远程Directus生成数据
node generate-billing-data.js remote
```

**该命令会：**
- 从Directus获取社区和业主信息
- 根据`billing-config.json`配置生成billings和billing_payments数据
- 输出到`billing-data-generated.json`文件

### 2. 导入数据到Directus

```bash
# 导入到本地Directus
node import-billing-data.js local

# 导入到远程Directus
node import-billing-data.js remote

# 导入前清空现有数据
node import-billing-data.js local --clear
```

**该命令会：**
- 读取`billing-data-generated.json`文件
- 批量导入到Directus
- 显示导入进度和结果

## ⚙️ 配置文件说明

### billing-config.json

```json
{
  "config": {
    "year": 2025,                          // 年份
    "months": [1, 2, 3, ..., 10],         // 生成1-10月数据
    "unit_price": 8,                       // 物业费单价（元/m²）
    "due_day": 25,                         // 每月到期日

    "payment_scenarios": {
      "fully_paid": {                      // 全部缴清
        "ratio": 0.6,                      // 占比60%
        "payment_pattern": "all"
      },
      "partially_paid": {                  // 部分缴费
        "ratio": 0.3,                      // 占比30%
        "payment_pattern": "random",
        "months_paid_range": [4, 8]        // 缴纳4-8个月
      },
      "unpaid": {                          // 完全欠费
        "ratio": 0.1,                      // 占比10%
        "payment_pattern": "none"
      }
    },

    "payment_methods": [                   // 支付方式权重
      {"method": "wechat", "weight": 0.5},
      {"method": "alipay", "weight": 0.3},
      {"method": "bank", "weight": 0.15},
      {"method": "cash", "weight": 0.05}
    ]
  }
}
```

## 📊 数据生成逻辑

### billings表（应收账单）

每个业主生成1-10月的账单：
- `period`: "2025-01" ~ "2025-10"
- `amount`: area × unit_price（每户每月金额固定）
- `area`: 80-150m²随机生成（每户固定）
- `is_paid`: 根据缴费场景设置
- `paid_at`: 缴费时间（如果已缴）

### billing_payments表（实收记录）

遵循**FIFO原则**（先进先出）：
- 必须从1月开始往后缴费
- `paid_periods`: JSON数组，记录缴了哪几个月
- `amount`: 该次缴费的总金额
- 支持分多次缴费（70%一次缴清，30%分2-3次）

### 缴费场景示例

**场景1：全部缴清（60%业主）**
```json
{
  "billings": [
    {"period": "2025-01", "is_paid": true},
    {"period": "2025-02", "is_paid": true},
    ...
    {"period": "2025-10", "is_paid": true}
  ],
  "billing_payments": [
    {
      "amount": 8000,  // 假设每月800元 × 10个月
      "paid_periods": ["2025-01", "2025-02", ..., "2025-10"]
    }
  ]
}
```

**场景2：部分缴费（30%业主）**
```json
{
  "billings": [
    {"period": "2025-01", "is_paid": true},
    {"period": "2025-02", "is_paid": true},
    {"period": "2025-03", "is_paid": true},
    {"period": "2025-04", "is_paid": true},
    {"period": "2025-05", "is_paid": true},
    {"period": "2025-06", "is_paid": true},
    {"period": "2025-07", "is_paid": false},  // 欠费
    {"period": "2025-08", "is_paid": false},  // 欠费
    {"period": "2025-09", "is_paid": false},  // 欠费
    {"period": "2025-10", "is_paid": false}   // 欠费
  ],
  "billing_payments": [
    {
      "amount": 3200,  // 4个月
      "paid_periods": ["2025-01", "2025-02", "2025-03", "2025-04"]
    },
    {
      "amount": 1600,  // 2个月
      "paid_periods": ["2025-05", "2025-06"]
    }
  ]
}
```

**场景3：完全欠费（10%业主）**
```json
{
  "billings": [
    {"period": "2025-01", "is_paid": false},
    {"period": "2025-02", "is_paid": false},
    ...
    {"period": "2025-10", "is_paid": false}
  ],
  "billing_payments": []  // 没有缴费记录
}
```

## 🔧 自定义配置

### 修改缴费比例

编辑`billing-config.json`：
```json
{
  "payment_scenarios": {
    "fully_paid": {"ratio": 0.5},      // 改为50%
    "partially_paid": {"ratio": 0.4},  // 改为40%
    "unpaid": {"ratio": 0.1}           // 保持10%
  }
}
```

### 修改物业费单价

```json
{
  "config": {
    "unit_price": 10  // 改为10元/m²
  }
}
```

### 修改月份范围

```json
{
  "config": {
    "months": [1, 2, 3, 4, 5, 6]  // 只生成1-6月数据
  }
}
```

## 📝 使用场景

### 场景1：初次导入测试数据

```bash
# 1. 生成数据
node generate-billing-data.js local

# 2. 导入（清空旧数据）
node import-billing-data.js local --clear
```

### 场景2：追加更多数据

```bash
# 1. 修改配置文件（调整比例或参数）
# 2. 生成新数据
node generate-billing-data.js local

# 3. 导入（不清空）
node import-billing-data.js local
```

### 场景3：测试不同配置

```bash
# 1. 备份当前配置
cp billing-config.json billing-config.backup.json

# 2. 修改配置
# 3. 生成并导入
node generate-billing-data.js local
node import-billing-data.js local --clear

# 4. 如需恢复
cp billing-config.backup.json billing-config.json
```

## ⚠️ 注意事项

1. **环境区分**：local和remote使用不同的Directus URL和Token
2. **数据清空**：使用`--clear`参数会删除现有数据，请谨慎操作
3. **FIFO原则**：缴费必须从最早月份开始，这是业务规则
4. **业主数据**：脚本会查询role为"resident"的用户，如果没有会使用所有用户
5. **面积生成**：每户面积80-150m²随机生成，一年内固定

## 🐛 常见问题

### Q1: 生成数据时报错"未找到业主用户"

**A**: 请先创建role为"resident"的用户，或者修改脚本使用所有用户。

### Q2: 导入时部分记录失败

**A**: 可能是外键约束问题，检查：
- community_id是否存在
- owner_id是否存在
- 字段类型是否匹配

### Q3: 如何修改默认的Token？

**A**: 编辑脚本中的`DIRECTUS_CONFIG`对象，修改对应环境的token。

### Q4: 生成的数据文件在哪里？

**A**: `billing-data-generated.json`，位于test-data目录。

## 📚 相关文档

- [数据模型文档](../../docs/finance-transparency/DATA_MODEL.md)
- [数据导入指南](../../docs/finance-transparency/DATA_IMPORT_GUIDE.md)
- [开发文档](../../docs/finance-transparency/DEVELOPMENT.md)
