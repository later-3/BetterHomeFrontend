#!/usr/bin/env node

/**
 * 财务测试数据生成器
 *
 * 用法：
 *   node generate-billing-data.js [local|remote]
 *
 * 功能：
 *   1. 从Directus获取社区和业主信息
 *   2. 根据配置生成billings和billing_payments数据
 *   3. 输出JSON文件供导入脚本使用
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 配置
const CONFIG_FILE = path.join(__dirname, 'billing-config.json');
const OUTPUT_FILE = path.join(__dirname, 'billing-data-generated.json');

// Directus配置
const env = process.argv[2] || 'local';
const DIRECTUS_CONFIG = {
  local: {
    url: 'http://localhost:8055',
    token: 'sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n'
  },
  remote: {
    url: 'https://www.betterhome.ink',
    token: 'sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n'
  }
};

const directus = DIRECTUS_CONFIG[env];
if (!directus) {
  console.error(`❌ 无效的环境: ${env}，请使用 local 或 remote`);
  process.exit(1);
}

console.log(`🔧 使用环境: ${env}`);
console.log(`📍 Directus URL: ${directus.url}`);
console.log('');

// 读取配置
const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));

// HTTP请求封装
async function fetchDirectus(endpoint, method = 'GET', body = null) {
  const url = `${directus.url}${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${directus.token}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json();
}

// 获取社区ID
async function getCommunityId() {
  console.log('📍 获取社区信息...');
  const result = await fetchDirectus('/items/communities?limit=1');

  if (!result.data || result.data.length === 0) {
    throw new Error('未找到社区数据');
  }

  const community = result.data[0];
  console.log(`✅ 社区: ${community.name} (${community.id})`);
  return community.id;
}

// 获取业主列表
async function getOwners() {
  console.log('👥 获取业主列表...');

  try {
    // 1. 先获取resident角色的UUID
    const rolesResult = await fetchDirectus('/roles?filter[name][_eq]=resident&fields=id,name');

    let residentRoleId = null;
    if (rolesResult.data && rolesResult.data.length > 0) {
      residentRoleId = rolesResult.data[0].id;
      console.log(`   找到resident角色: ${residentRoleId}`);
    }

    // 2. 如果找到resident角色，用角色ID过滤用户
    let result;
    if (residentRoleId) {
      result = await fetchDirectus(`/users?filter[role][_eq]=${residentRoleId}&limit=-1&fields=id,first_name,last_name,email`);
    } else {
      console.warn('⚠️  未找到resident角色，将获取所有非管理员用户');
      // 获取角色不是Administrator的用户
      const adminRoleResult = await fetchDirectus('/roles?filter[name][_eq]=Administrator&fields=id');
      const adminRoleId = adminRoleResult.data?.[0]?.id;

      if (adminRoleId) {
        result = await fetchDirectus(`/users?filter[role][_neq]=${adminRoleId}&limit=-1&fields=id,first_name,last_name,email`);
      } else {
        result = await fetchDirectus('/users?limit=20&fields=id,first_name,last_name,email');
      }
    }

    if (!result.data || result.data.length === 0) {
      console.warn('⚠️  未找到任何用户');
      return [];
    }

    console.log(`✅ 找到 ${result.data.length} 个业主用户`);

    // 打印前几个用户作为确认
    if (result.data.length > 0) {
      console.log(`   示例: ${result.data.slice(0, 3).map(u => u.first_name || u.email).join(', ')}...`);
    }

    return result.data;
  } catch (error) {
    console.error(`❌ 获取业主列表失败: ${error.message}`);
    throw error;
  }
}

// 生成随机面积
function randomArea() {
  return Math.floor(Math.random() * (150 - 80 + 1)) + 80;
}

// 生成billings记录
function generateBillings(owners, communityId, config) {
  console.log('📝 生成billings记录...');

  const billings = [];
  const { year, months, unit_price, due_day } = config.config;

  for (const owner of owners) {
    // 每个业主一年的面积固定
    const area = randomArea();
    const monthlyAmount = area * unit_price;

    for (const month of months) {
      const period = `${year}-${String(month).padStart(2, '0')}`;
      const dueDate = `${period}-${String(due_day).padStart(2, '0')}T23:59:59.000Z`;

      billings.push({
        id: crypto.randomUUID(),
        community_id: communityId,
        owner_id: owner.id,
        period,
        amount: monthlyAmount,
        area,
        unit_price,
        due_date: dueDate,
        is_paid: false, // 默认未缴费，后面根据场景修改
        paid_at: null,
        late_fee: 0,
        notes: null
      });
    }
  }

  console.log(`✅ 生成了 ${billings.length} 条billings记录`);
  return billings;
}

// 根据配置分配缴费场景
function assignPaymentScenarios(owners, config) {
  const scenarios = config.config.payment_scenarios;
  const assignments = [];

  let fullyPaidCount = Math.floor(owners.length * scenarios.fully_paid.ratio);
  let partiallyPaidCount = Math.floor(owners.length * scenarios.partially_paid.ratio);
  let unpaidCount = owners.length - fullyPaidCount - partiallyPaidCount;

  console.log('📊 缴费场景分配:');
  console.log(`   - 全部缴清: ${fullyPaidCount} 户`);
  console.log(`   - 部分缴费: ${partiallyPaidCount} 户`);
  console.log(`   - 完全欠费: ${unpaidCount} 户`);

  for (let i = 0; i < owners.length; i++) {
    let scenario;
    if (i < fullyPaidCount) {
      scenario = 'fully_paid';
    } else if (i < fullyPaidCount + partiallyPaidCount) {
      scenario = 'partially_paid';
    } else {
      scenario = 'unpaid';
    }

    assignments.push({
      owner_id: owners[i].id,
      owner_name: owners[i].first_name || owners[i].email,
      scenario
    });
  }

  return assignments;
}

// 生成billing_payments记录（遵循FIFO原则）
function generateBillingPayments(billings, assignments, config) {
  console.log('💰 生成billing_payments记录（FIFO原则）...');

  const payments = [];
  const { year, months } = config.config;
  const scenarios = config.config.payment_scenarios;
  const paymentMethods = config.config.payment_methods;

  // 随机选择支付方式
  function randomPaymentMethod() {
    const rand = Math.random();
    let cumulative = 0;
    for (const pm of paymentMethods) {
      cumulative += pm.weight;
      if (rand <= cumulative) {
        return pm.method;
      }
    }
    return paymentMethods[0].method;
  }

  for (const assignment of assignments) {
    const { owner_id, scenario } = assignment;
    const scenarioConfig = scenarios[scenario];

    // 获取该业主的所有账单（按period排序，FIFO）
    const ownerBillings = billings
      .filter(b => b.owner_id === owner_id)
      .sort((a, b) => a.period.localeCompare(b.period));

    if (scenarioConfig.payment_pattern === 'none') {
      // 完全不缴费，跳过
      continue;
    }

    let monthsToPay;
    if (scenarioConfig.payment_pattern === 'all') {
      // 全部缴清
      monthsToPay = ownerBillings.length;
    } else if (scenarioConfig.payment_pattern === 'random') {
      // 随机缴纳几个月
      const [min, max] = scenarioConfig.months_paid_range;
      monthsToPay = Math.floor(Math.random() * (max - min + 1)) + min;
      monthsToPay = Math.min(monthsToPay, ownerBillings.length);
    }

    if (monthsToPay === 0) continue;

    // 模拟可能分多次缴费（但也遵循FIFO）
    // 70%的人一次性缴清所有月份，30%的人分2-3次缴
    const paymentCount = Math.random() < 0.7 ? 1 : (Math.random() < 0.5 ? 2 : 3);

    let remainingMonths = monthsToPay;
    let currentIndex = 0;

    for (let i = 0; i < paymentCount && remainingMonths > 0; i++) {
      // 每次缴纳的月数
      let monthsInThisPayment;
      if (i === paymentCount - 1) {
        // 最后一次缴纳剩余所有
        monthsInThisPayment = remainingMonths;
      } else {
        // 随机缴纳1-4个月
        monthsInThisPayment = Math.min(
          Math.floor(Math.random() * 4) + 1,
          remainingMonths
        );
      }

      // 取前N个月的账单（FIFO）
      const billingsInThisPayment = ownerBillings.slice(currentIndex, currentIndex + monthsInThisPayment);
      const totalAmount = billingsInThisPayment.reduce((sum, b) => sum + b.amount, 0);
      const paidPeriods = billingsInThisPayment.map(b => b.period);
      const lastPeriod = paidPeriods[paidPeriods.length - 1];

      // 缴费时间：在该月的15-25号之间
      const payDay = Math.floor(Math.random() * 11) + 15;
      const paidAt = `${lastPeriod}-${String(payDay).padStart(2, '0')}T${String(Math.floor(Math.random() * 12) + 9).padStart(2, '0')}:00:00.000Z`;

      // 更新billings为已缴费
      for (const billing of billingsInThisPayment) {
        billing.is_paid = true;
        billing.paid_at = paidAt;
      }

      // 创建缴费记录
      payments.push({
        id: crypto.randomUUID(),
        owner_id,
        amount: totalAmount,
        paid_at: paidAt,
        paid_periods: paidPeriods,
        payment_method: randomPaymentMethod(),
        payer_name: assignment.owner_name,
        transaction_no: `TX${year}${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        proof_files: [], // 测试数据不上传文件
        notes: `测试数据 - ${scenario}`
      });

      currentIndex += monthsInThisPayment;
      remainingMonths -= monthsInThisPayment;
    }
  }

  console.log(`✅ 生成了 ${payments.length} 条billing_payments记录`);
  return payments;
}

// 主函数
async function main() {
  try {
    console.log('🚀 开始生成财务测试数据...\n');

    // 1. 获取基础信息
    const communityId = await getCommunityId();
    const owners = await getOwners();

    if (owners.length === 0) {
      console.error('❌ 没有找到业主用户，请先创建用户');
      process.exit(1);
    }

    console.log('');

    // 2. 生成billings
    const billings = generateBillings(owners, communityId, config);

    // 3. 分配缴费场景
    const assignments = assignPaymentScenarios(owners, config);

    // 4. 生成billing_payments（会同时更新billings的is_paid状态）
    const payments = generateBillingPayments(billings, assignments, config);

    // 5. 统计
    const paidCount = billings.filter(b => b.is_paid).length;
    const unpaidCount = billings.filter(b => !b.is_paid).length;

    console.log('');
    console.log('📊 数据统计:');
    console.log(`   - 账单总数: ${billings.length}`);
    console.log(`   - 已缴账单: ${paidCount} (${(paidCount/billings.length*100).toFixed(1)}%)`);
    console.log(`   - 欠费账单: ${unpaidCount} (${(unpaidCount/billings.length*100).toFixed(1)}%)`);
    console.log(`   - 缴费记录: ${payments.length}`);

    // 6. 输出到JSON文件
    const output = {
      metadata: {
        generated_at: new Date().toISOString(),
        environment: env,
        directus_url: directus.url,
        config_version: config.version
      },
      statistics: {
        total_billings: billings.length,
        paid_billings: paidCount,
        unpaid_billings: unpaidCount,
        total_payments: payments.length,
        owners_count: owners.length
      },
      data: {
        billings,
        billing_payments: payments
      }
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

    console.log('');
    console.log(`✅ 数据已生成并保存到: ${OUTPUT_FILE}`);
    console.log('');
    console.log('📝 下一步：运行导入脚本');
    console.log(`   node import-billing-data.js ${env}`);

  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

main();
