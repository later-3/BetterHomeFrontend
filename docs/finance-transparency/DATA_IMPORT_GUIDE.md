# 财务透明功能 - 测试数据导入指南

## 📋 目录

1. [导入方式对比](#导入方式对比)
2. [方式一：REST API批量导入（推荐）](#方式一rest-api批量导入推荐)
3. [方式二：Directus Admin Panel手动录入](#方式二directus-admin-panel手动录入)
4. [测试数据说明](#测试数据说明)
5. [验证数据导入](#验证数据导入)

---

## 导入方式对比

| 方式 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **REST API** | 快速、可重复执行、支持大批量 | 需要写脚本 | 开发测试、批量导入 |
| **Admin Panel** | 无需编程、可视化、适合单条录入 | 效率低、易出错 | 少量数据、临时修改 |
| **CSV导入** | Excel编辑方便 | Directus需要配置、关系字段复杂 | 大量数据、非技术人员 |

**结论：** 对于测试数据导入，推荐使用 **REST API** 方式。

---

## 方式一：REST API批量导入（推荐）

### 1.1 准备工作

#### 获取必要的ID

```bash
# 1. 获取社区ID（community_id）
curl -s https://www.betterhome.ink/items/communities \
  -H "Authorization: Bearer sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n" \
  | jq '.data[] | {id, name}'

# 2. 获取业主用户ID（owner_id）
curl -s https://www.betterhome.ink/users \
  -H "Authorization: Bearer sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n" \
  | jq '.data[] | {id, first_name, last_name, email}'

# 3. 获取楼栋ID（building_id）
curl -s https://www.betterhome.ink/items/buildings \
  -H "Authorization: Bearer sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n" \
  | jq '.data[] | {id, name, community_id}'
```

#### 保存ID到变量

```bash
export DIRECTUS_URL="https://www.betterhome.ink"
export DIRECTUS_TOKEN="sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"
export COMMUNITY_ID="你的社区ID"
export OWNER_ID_1="业主1的ID"
export OWNER_ID_2="业主2的ID"
# ... 更多业主ID
```

---

### 1.2 数据导入顺序

#### Step 1: 创建员工信息（employees）

**为什么最先？** 工资记录需要关联员工ID

```bash
curl -X POST "$DIRECTUS_URL/items/employees" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "community_id": "'"$COMMUNITY_ID"'",
    "name": "张三",
    "phone": "13800138001",
    "id_card_last4": "1234",
    "position_type": "security",
    "position_title": "保安队长",
    "employment_status": "active",
    "hire_date": "2024-01-01",
    "base_salary": 5500
  }'
```

**批量创建示例：**

```javascript
// 保存为 create-employees.js
const employees = [
  { name: "张三", position_type: "security", position_title: "保安队长", base_salary: 5500 },
  { name: "李四", position_type: "security", position_title: "保安队员", base_salary: 4500 },
  { name: "王五", position_type: "cleaning", position_title: "保洁员", base_salary: 4000 },
  { name: "赵六", position_type: "management", position_title: "物业经理", base_salary: 6000 },
];

const communityId = process.env.COMMUNITY_ID;
const token = process.env.DIRECTUS_TOKEN;
const url = process.env.DIRECTUS_URL || 'https://www.betterhome.ink';

async function createEmployees() {
  for (const emp of employees) {
    const response = await fetch(`${url}/items/employees`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        community_id: communityId,
        ...emp,
        employment_status: 'active',
        hire_date: '2024-01-01'
      })
    });
    const data = await response.json();
    console.log(`✅ 创建员工: ${emp.name} (${data.data.id})`);
  }
}

createEmployees();
```

**运行：**
```bash
node create-employees.js
```

---

#### Step 2: 创建物业费账单（billings）

```bash
# 为每个业主创建1-10月的账单
curl -X POST "$DIRECTUS_URL/items/billings" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "community_id": "'"$COMMUNITY_ID"'",
    "owner_id": "'"$OWNER_ID_1"'",
    "period": "2025-01",
    "amount": 800.00,
    "is_paid": false,
    "area": 100,
    "unit_price": 8.00,
    "due_date": "2025-01-31T23:59:59Z"
  }'
```

**批量创建脚本：**

```javascript
// 保存为 create-billings.js
const owners = [
  { id: process.env.OWNER_ID_1, area: 120 },
  { id: process.env.OWNER_ID_2, area: 95 },
  { id: process.env.OWNER_ID_3, area: 85 },
  { id: process.env.OWNER_ID_4, area: 110 },
];

const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05',
                '2025-06', '2025-07', '2025-08', '2025-09', '2025-10'];
const unitPrice = 8; // 元/m²

async function createBillings() {
  for (const owner of owners) {
    for (const period of months) {
      const amount = owner.area * unitPrice;
      const response = await fetch(`${process.env.DIRECTUS_URL}/items/billings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DIRECTUS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          community_id: process.env.COMMUNITY_ID,
          owner_id: owner.id,
          period,
          amount,
          is_paid: false,
          area: owner.area,
          unit_price: unitPrice,
          due_date: `${period}-25T23:59:59Z`
        })
      });
      const data = await response.json();
      console.log(`✅ 创建账单: ${period} - Owner ${owner.id.slice(0,8)}... (¥${amount})`);
    }
  }
}

createBillings();
```

---

#### Step 3: 创建缴费记录（billing_payments）

**重要：** 遵循FIFO原则（先进先出），一次缴费可以支付多个月的物业费

**设计原则：**
- 必须从最早的未缴月份开始缴费
- 一次缴费更新多个billing记录的is_paid状态
- 创建一个payment记录，记录paid_periods数组

**示例：业主在5月15日一次性缴纳4个月物业费（1-4月）**

```bash
# 1. 查询该业主未缴费的账单（按period排序，FIFO原则）
UNPAID_BILLINGS=$(curl -s "$DIRECTUS_URL/items/billings?\
filter[owner_id][_eq]=$OWNER_ID_1&\
filter[is_paid][_eq]=false&\
sort=period&\
limit=4" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN")

# 2. 获取这4个账单的ID和period
BILLING_IDS=$(echo $UNPAID_BILLINGS | jq -r '.data[] | .id')
PAID_PERIODS=$(echo $UNPAID_BILLINGS | jq -r '[.data[] | .period]')
TOTAL_AMOUNT=$(echo $UNPAID_BILLINGS | jq -r '[.data[] | .amount] | add')

# 3. 批量更新这4个账单为已缴费
for BILLING_ID in $BILLING_IDS; do
  curl -X PATCH "$DIRECTUS_URL/items/billings/$BILLING_ID" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "is_paid": true,
      "paid_at": "2025-05-15T10:30:00Z"
    }'
done

# 4. 创建一条缴费记录
curl -X POST "$DIRECTUS_URL/items/billing_payments" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "owner_id": "'"$OWNER_ID_1"'",
    "amount": '"$TOTAL_AMOUNT"',
    "paid_at": "2025-05-15T10:30:00Z",
    "paid_periods": ["2025-01", "2025-02", "2025-03", "2025-04"],
    "payment_method": "wechat",
    "payer_name": "张业主",
    "transaction_no": "WX20250515103000001",
    "proof_files": []
  }'
```

**批量创建脚本（模拟不同业主的缴费情况）：**

```javascript
// 保存为 create-billing-payments.js
async function createBillingPayments() {
  const url = process.env.DIRECTUS_URL;
  const token = process.env.DIRECTUS_TOKEN;

  // 获取所有业主
  const ownersRes = await fetch(`${url}/users?filter[role][name][_eq]=resident`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const owners = (await ownersRes.json()).data;

  for (const owner of owners) {
    // 1. 获取该业主所有未缴费的账单（按period排序，FIFO）
    const billingsRes = await fetch(
      `${url}/items/billings?filter[owner_id][_eq]=${owner.id}&filter[is_paid][_eq]=false&sort=period&limit=-1`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const unpaidBillings = (await billingsRes.json()).data;

    if (unpaidBillings.length === 0) continue;

    // 2. 模拟不同缴费场景
    // - 85%的业主已缴完所有月份
    // - 10%的业主缴了一部分
    // - 5%的业主一个月都没缴
    const random = Math.random();
    let monthsToPay = 0;

    if (random < 0.85) {
      monthsToPay = unpaidBillings.length; // 全部缴清
    } else if (random < 0.95) {
      monthsToPay = Math.floor(unpaidBillings.length * 0.6); // 缴60%
    } else {
      monthsToPay = 0; // 一个月都不缴
    }

    if (monthsToPay === 0) continue;

    // 3. 取前N个月的账单（FIFO原则）
    const billingsToPay = unpaidBillings.slice(0, monthsToPay);
    const totalAmount = billingsToPay.reduce((sum, b) => sum + b.amount, 0);
    const paidPeriods = billingsToPay.map(b => b.period);
    const lastPeriod = paidPeriods[paidPeriods.length - 1];

    // 4. 批量更新billing记录为已缴费
    await Promise.all(
      billingsToPay.map(billing =>
        fetch(`${url}/items/billings/${billing.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            is_paid: true,
            paid_at: `${lastPeriod}-15T10:00:00Z`
          })
        })
      )
    );

    // 5. 创建一条缴费记录
    const paymentRes = await fetch(`${url}/items/billing_payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        owner_id: owner.id,
        amount: totalAmount,
        paid_at: `${lastPeriod}-15T10:00:00Z`,
        paid_periods: paidPeriods,
        payment_method: 'wechat',
        payer_name: owner.first_name || '业主',
        transaction_no: `TX${Date.now()}${Math.random().toString(36).substr(2, 6)}`,
        proof_files: []
      })
    });

    console.log(`✅ 创建缴费: Owner ${owner.id.slice(0, 8)}... - ${monthsToPay}个月 (¥${totalAmount})`);
    console.log(`   缴费月份: ${paidPeriods.join(', ')}`);
  }
}

createBillingPayments();
```

---

#### Step 4: 创建公共收益（incomes）

```javascript
// 保存为 create-incomes.js
const incomeTypes = [
  { type: 'parking', label: '停车费', min: 1200, max: 1800 },
  { type: 'advertising', label: '广告收益', min: 300, max: 600 },
  { type: 'express_locker', label: '快递柜', min: 200, max: 400 },
  { type: 'venue_rental', label: '场地租赁', min: 150, max: 350 },
];

const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05',
                '2025-06', '2025-07', '2025-08', '2025-09', '2025-10'];

function randomAmount(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function createIncomes() {
  for (const month of months) {
    for (const incomeType of incomeTypes) {
      const amount = randomAmount(incomeType.min, incomeType.max);
      const response = await fetch(`${process.env.DIRECTUS_URL}/items/incomes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DIRECTUS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          community_id: process.env.COMMUNITY_ID,
          income_type: incomeType.type,
          title: `${month} ${incomeType.label}`,
          description: `${month}月${incomeType.label}收入`,
          amount,
          income_date: `${month}-20T10:00:00Z`,
          period: month,
          payment_method: 'bank'
        })
      });
      console.log(`✅ 创建收益: ${month} ${incomeType.label} (¥${amount})`);
    }
  }
}

createIncomes();
```

---

#### Step 5: 创建工资记录（salary_records）

**重要：** 需要先获取员工ID

```javascript
// 保存为 create-salary-records.js
async function createSalaryRecords() {
  // 1. 获取所有员工
  const employeesRes = await fetch(
    `${process.env.DIRECTUS_URL}/items/employees?filter[employment_status][_eq]=active`,
    {
      headers: { 'Authorization': `Bearer ${process.env.DIRECTUS_TOKEN}` }
    }
  );
  const employees = (await employeesRes.json()).data;

  const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05',
                  '2025-06', '2025-07', '2025-08', '2025-09', '2025-10'];

  for (const month of months) {
    for (const employee of employees) {
      const baseSalary = employee.base_salary;
      const bonus = Math.random() < 0.3 ? Math.floor(Math.random() * 500) : 0;
      const actualAmount = baseSalary + bonus - 400; // 扣除400社保公积金

      const response = await fetch(`${process.env.DIRECTUS_URL}/items/salary_records`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DIRECTUS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employee_id: employee.id,
          community_id: process.env.COMMUNITY_ID,
          period: month,
          base_salary: baseSalary,
          bonus,
          social_security: 200,
          housing_fund: 200,
          actual_amount: actualAmount,
          payment_date: `${month}-25T10:00:00Z`,
          payment_method: 'bank'
        })
      });
      console.log(`✅ 创建工资: ${month} ${employee.name} (¥${actualAmount})`);
    }
  }
}

createSalaryRecords();
```

---

#### Step 6: 创建其他支出（expenses）

```javascript
// 保存为 create-expenses.js
const expenseTypes = [
  { type: 'utilities', label: '水电费', min: 800, max: 1200 },
  { type: 'maintenance', label: '维修费', min: 500, max: 1000 },
  { type: 'materials', label: '物料采购', min: 200, max: 500 },
];

const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05',
                '2025-06', '2025-07', '2025-08', '2025-09', '2025-10'];

function randomAmount(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function createExpenses() {
  for (const month of months) {
    for (const expenseType of expenseTypes) {
      const amount = randomAmount(expenseType.min, expenseType.max);
      const response = await fetch(`${process.env.DIRECTUS_URL}/items/expenses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DIRECTUS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          community_id: process.env.COMMUNITY_ID,
          expense_type: expenseType.type,
          title: `${month} ${expenseType.label}`,
          description: `${month}月${expenseType.label}支出`,
          amount,
          paid_at: `${month}-18T10:00:00Z`,
          period: month,
          payment_method: 'bank',
          status: 'approved'
        })
      });
      console.log(`✅ 创建支出: ${month} ${expenseType.label} (¥${amount})`);
    }
  }
}

createExpenses();
```

---

### 1.3 完整自动化脚本

将上述所有脚本整合到一个文件中：

```javascript
// 保存为 scripts/import-finance-test-data.js
#!/usr/bin/env node

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://www.betterhome.ink';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || 'sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n';
const COMMUNITY_ID = process.env.COMMUNITY_ID;

if (!COMMUNITY_ID) {
  console.error('❌ 请设置 COMMUNITY_ID 环境变量');
  process.exit(1);
}

// ... 包含所有上述函数 ...

async function main() {
  console.log('🚀 开始导入财务测试数据...\n');

  console.log('Step 1: 创建员工信息...');
  await createEmployees();

  console.log('\nStep 2: 创建物业费账单...');
  await createBillings();

  console.log('\nStep 3: 创建缴费记录...');
  await createBillingPayments();

  console.log('\nStep 4: 创建公共收益...');
  await createIncomes();

  console.log('\nStep 5: 创建工资记录...');
  await createSalaryRecords();

  console.log('\nStep 6: 创建其他支出...');
  await createExpenses();

  console.log('\n✅ 所有测试数据导入完成！');
}

main().catch(console.error);
```

**运行：**
```bash
COMMUNITY_ID="你的社区ID" node scripts/import-finance-test-data.js
```

---

## 方式二：Directus Admin Panel手动录入

### 2.1 访问Admin Panel

1. 打开浏览器访问：https://www.betterhome.ink/admin
2. 登录管理员账号

### 2.2 逐表录入数据

#### Step 1: 员工信息（employees）

1. 点击左侧 **employees** 表
2. 点击右上角 **Create Item** 按钮
3. 填写表单：
   - Community: 选择社区
   - Name: 张三
   - Position Type: security
   - Position Title: 保安队长
   - Employment Status: active
   - Hire Date: 2024-01-01
   - Base Salary: 5500
4. 点击 **Save** 保存
5. 重复以上步骤创建更多员工

#### Step 2: 物业费账单（billings）

1. 点击 **billings** 表
2. 创建新账单，填写：
   - Community: 选择社区
   - Owner: 选择业主
   - Period: 2025-01
   - Amount: 800
   - Is Paid: false（未缴费）
   - Area: 100
   - Unit Price: 8.00
3. 保存

**注意：** 手动录入效率低，适合少量数据

---

### 2.3 CSV批量导入（可选）

Directus支持CSV导入，但需要配置：

1. 准备CSV文件（Excel编辑）
2. Admin Panel → Collections → Import
3. 选择CSV文件
4. 映射字段
5. 导入

**局限性：**
- 外键字段需要手动填UUID
- 不支持自动关联
- 适合简单表

---

## 测试数据说明

### 3.1 数据量规划

| 表名 | 记录数 | 说明 |
|------|--------|------|
| employees | 4-6条 | 保安、保洁、管理人员 |
| billings | 40条 | 4业主 × 10月 |
| billing_payments | 34条 | 85%缴费率 |
| incomes | 40条 | 4类型 × 10月 |
| salary_records | 50条 | 5员工 × 10月 |
| expenses | 30条 | 3类型 × 10月 |

**总计：** 约 200条记录

### 3.2 预期财务汇总（1-10月）

- **总收入：** 约 ¥270,000
  - 物业费实收：¥246,000（4业主 × 10月 × 85%）
  - 公共收益：¥24,000
- **总支出：** 约 ¥252,000
  - 工资支出：¥230,000（5员工 × 10月 × ¥4600平均）
  - 其他支出：¥22,000
- **结余：** 约 ¥18,000

---

## 验证数据导入

### 4.1 API验证

```bash
# 1. 检查员工数量
curl -s "$DIRECTUS_URL/items/employees?aggregate[count]=id" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  | jq '.data[0].count.id'

# 2. 检查账单数量
curl -s "$DIRECTUS_URL/items/billings?aggregate[count]=id" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  | jq '.data[0].count.id'

# 3. 检查缴费记录
curl -s "$DIRECTUS_URL/items/billing_payments?aggregate[count]=id" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  | jq '.data[0].count.id'

# 4. 查询2025-01月的财务数据
curl -s "$DIRECTUS_URL/items/billing_payments?filter[period][_eq]=2025-01&aggregate[sum]=amount" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  | jq '.data[0].sum.amount'
```

### 4.2 Admin Panel验证

1. 访问 https://www.betterhome.ink/admin
2. 逐个检查表的记录数
3. 查看关系字段是否正确关联

### 4.3 小程序验证

1. 登录小程序（业主账号）
2. 进入"财务透明"页面
3. 选择1-10月
4. 检查：
   - 总收入、总支出、结余是否正确
   - 收入明细是否显示
   - 支出明细是否显示

---

## 常见问题

### Q1: 导入时报错 "Invalid UUID"

**原因：** community_id 或 owner_id 格式不正确

**解决：**
```bash
# 确保使用正确的UUID格式
echo $COMMUNITY_ID  # 应该是类似 2a5c769e-9909-4331-99b3-983c8b1175c6
```

### Q2: billing_payments 创建失败

**原因1：** owner_id 不存在或无权限

**解决：**
```bash
# 先查询业主是否存在
curl -s "$DIRECTUS_URL/users/$OWNER_ID" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN"
```

**原因2：** paid_periods 格式错误

**解决：**
```bash
# 确保paid_periods是JSON数组格式
# ✅ 正确: ["2025-01","2025-02"]
# ❌ 错误: "2025-01,2025-02"
```

### Q3: 工资记录创建后没有生成expense

**原因：** 可能没有配置触发器或Flows

**解决：**
- 检查Directus Flows是否配置了自动创建expense的逻辑
- 或者在salary_records创建后手动创建对应的expense

### Q4: 数据已存在，如何清空重新导入？

**警告：** 删除操作不可恢复！

```bash
# 删除所有财务数据（按依赖顺序）
# 注意：billing_payments不再依赖billings，所以顺序可以调整

curl -X DELETE "$DIRECTUS_URL/items/billing_payments?filter[owner_id][_in]=$OWNER_IDS" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN"

curl -X DELETE "$DIRECTUS_URL/items/billings?filter[community_id][_eq]=$COMMUNITY_ID" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN"

curl -X DELETE "$DIRECTUS_URL/items/salary_records?filter[community_id][_eq]=$COMMUNITY_ID" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN"

curl -X DELETE "$DIRECTUS_URL/items/expenses?filter[community_id][_eq]=$COMMUNITY_ID" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN"

curl -X DELETE "$DIRECTUS_URL/items/incomes?filter[community_id][_eq]=$COMMUNITY_ID" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN"

curl -X DELETE "$DIRECTUS_URL/items/employees?filter[community_id][_eq]=$COMMUNITY_ID" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN"
```

**FIFO原则提示：**
如果只想重置某个业主的缴费记录，需要：
1. 先删除该业主的billing_payments记录
2. 然后将该业主所有billings的is_paid改回false
```bash
# 重置业主缴费状态
curl -X PATCH "$DIRECTUS_URL/items/billings?filter[owner_id][_eq]=$OWNER_ID" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_paid": false, "paid_at": null}'
```

---

## 下一步

1. ✅ 梳理数据模型关系 → 完成
2. ✅ 设计测试数据结构 → 完成
3. 🔜 执行数据导入脚本
4. 🔜 在小程序中验证数据显示

---

**最后更新：** 2025-10-18
**维护者：** 开发团队
