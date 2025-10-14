/**
 * 生成 2025 年 1-10 月财务测试数据
 * 简化版本 - 仅用于功能测试
 */

const DIRECTUS_URL = 'http://localhost:8055';
const ADMIN_TOKEN = 'sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n';

// 兰庭雅苑社区ID
const COMMUNITY_ID = '2a5c769e-9909-4331-99b3-983c8b1175c6';

// Admin 用户ID（用于 created_by）
const ADMIN_USER_ID = '4241c424-0bd4-4f85-90b6-31cb57d31b8e';

// 使用真实的用户ID（从数据库查询）
const OWNERS = [
  { id: '1030a8c2-888e-4ff9-a9e8-d1b6a7c3d8ea', name: '徐若楠', area: 120 },
  { id: '1825ab24-03e2-4bab-891a-53913f43df40', name: 'Bob', area: 95 },
  { id: '26411dae-64fe-40e8-8aa6-35cf1126888d', name: '林浩然', area: 85 },
  { id: '4d14cc70-441a-4237-844f-cd29bab97fbe', name: '陈雅宁', area: 110 },
];

// 物业费单价：60元/m²/月
const UNIT_PRICE = 60;

// 收入类型及每月金额范围
const INCOME_TYPES = [
  { type: 'parking', label: '车位租金', min: 1200, max: 1800 },
  { type: 'advertising', label: '广告收益', min: 300, max: 600 },
  { type: 'express_locker', label: '快递柜分成', min: 200, max: 400 },
  { type: 'venue_rental', label: '场地租赁', min: 150, max: 350 },
];

// 支出类型及每月金额范围
const EXPENSE_TYPES = [
  { type: 'salary', label: '人员工资', amount: 23000 }, // 固定
  { type: 'utilities', label: '水电费', min: 800, max: 1200 },
  { type: 'maintenance', label: '维修保养', min: 500, max: 1000 },
  { type: 'materials', label: '物料采购', min: 200, max: 500 },
];

// 随机金额
function randomAmount(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// 随机日期
function randomDate(year, month) {
  const day = Math.floor(Math.random() * 28) + 1; // 1-28 避免月份问题
  const hour = Math.floor(Math.random() * 24);
  const minute = Math.floor(Math.random() * 60);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`;
}

// 生成UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// API 请求
async function apiRequest(endpoint, method = 'GET', data = null) {
  const url = `${DIRECTUS_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error (${response.status}): ${error}`);
  }

  return response.json();
}

// 生成单月数据
async function generateMonthData(year, month) {
  const period = `${year}-${String(month).padStart(2, '0')}`;
  console.log(`\n生成 ${period} 数据...`);

  const billingIds = [];

  // 1. 生成物业费账单（应收）
  console.log('  创建物业费账单...');
  for (const owner of OWNERS) {
    const billingAmount = owner.area * UNIT_PRICE;
    const dueDate = `${year}-${String(month).padStart(2, '0')}-28T23:59:59.000Z`;
    const billingId = generateUUID();

    await apiRequest('/items/billings', 'POST', {
      id: billingId,
      community_id: COMMUNITY_ID,
      owner_id: owner.id,
      period,
      billing_amount: billingAmount,
      area: owner.area,
      unit_price: UNIT_PRICE,
      status: 'paid',
      paid_amount: billingAmount,
      due_date: dueDate,
    });

    billingIds.push({ billingId, ownerId: owner.id, amount: billingAmount, period });
  }
  console.log(`    ✓ 创建了 ${billingIds.length} 条账单`);

  // 2. 生成物业费收款记录（实收）
  console.log('  创建物业费收款记录...');
  for (const { billingId, ownerId, amount, period } of billingIds) {
    // 80% 当月缴费，20% 下月缴费
    const isOnTime = Math.random() < 0.8;
    let paidAtMonth = month;
    if (!isOnTime && month < 10) {
      paidAtMonth = month + 1; // 下月缴费
    }

    const paidAt = randomDate(year, paidAtMonth);

    await apiRequest('/items/billing_payments', 'POST', {
      id: generateUUID(),
      billing_id: billingId,
      community_id: COMMUNITY_ID,
      owner_id: ownerId,
      amount,
      paid_at: paidAt,
      period, // 从账单继承
      payment_method: ['wechat', 'alipay', 'bank'][Math.floor(Math.random() * 3)],
      payer_name: '业主本人',
    });
  }
  console.log(`    ✓ 创建了 ${billingIds.length} 条收款记录`);

  // 3. 生成公共收益
  console.log('  创建公共收益记录...');
  for (const incomeType of INCOME_TYPES) {
    const amount = randomAmount(incomeType.min, incomeType.max);
    const incomeDate = randomDate(year, month);

    await apiRequest('/items/incomes', 'POST', {
      id: generateUUID(),
      community_id: COMMUNITY_ID,
      income_type: incomeType.type,
      title: `${period} ${incomeType.label}`,
      description: `兰庭雅苑${period}月${incomeType.label}`,
      amount,
      income_date: incomeDate,
      period,
      payment_method: 'bank',
      transaction_no: `INCOME${year}${String(month).padStart(2, '0')}${Math.floor(Math.random() * 10000)}`,
    });
  }
  console.log(`    ✓ 创建了 ${INCOME_TYPES.length} 条公共收益`);

  // 4. 生成支出记录
  console.log('  创建支出记录...');
  for (const expenseType of EXPENSE_TYPES) {
    const amount = expenseType.amount || randomAmount(expenseType.min, expenseType.max);
    const paidAt = randomDate(year, month);

    await apiRequest('/items/expenses', 'POST', {
      id: generateUUID(),
      community_id: COMMUNITY_ID,
      expense_type: expenseType.type,
      title: `${period} ${expenseType.label}`,
      description: `兰庭雅苑${period}月${expenseType.label}`,
      amount,
      paid_at: paidAt,
      period,
      payment_method: 'bank',
      status: 'approved',
      created_by: ADMIN_USER_ID,
    });
  }
  console.log(`    ✓ 创建了 ${EXPENSE_TYPES.length} 条支出记录`);

  console.log(`  ✓ ${period} 数据生成完成`);
}

// 主函数
async function main() {
  console.log('============================================================');
  console.log('生成 2025 年 1-10 月财务测试数据');
  console.log('============================================================');
  console.log(`社区：兰庭雅苑 (${COMMUNITY_ID})`);
  console.log(`业主数：${OWNERS.length}`);
  console.log(`月份范围：2025-01 到 2025-10`);
  console.log('');

  const startTime = Date.now();

  try {
    // 生成 1-10 月数据
    for (let month = 1; month <= 10; month++) {
      await generateMonthData(2025, month);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n============================================================');
    console.log('✓ 数据生成完成！');
    console.log('============================================================');
    console.log(`总耗时：${duration} 秒`);
    console.log('');
    console.log('生成数据统计：');
    console.log(`  - 物业费账单：${OWNERS.length * 10} 条`);
    console.log(`  - 物业费收款：${OWNERS.length * 10} 条`);
    console.log(`  - 公共收益：${INCOME_TYPES.length * 10} 条`);
    console.log(`  - 支出记录：${EXPENSE_TYPES.length * 10} 条`);
    console.log(`  - 总计：${(OWNERS.length * 2 + INCOME_TYPES.length + EXPENSE_TYPES.length) * 10} 条`);
    console.log('');
    console.log('下一步：');
    console.log('1. 访问 http://localhost:8055/admin 查看数据');
    console.log('2. 开始实现财务透明功能');

  } catch (error) {
    console.error('\n✗ 数据生成失败：', error.message);
    process.exit(1);
  }
}

main();
