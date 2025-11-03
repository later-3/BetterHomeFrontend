#!/usr/bin/env node

/**
 * 同步业主的缴费记录到账单表
 * 根据billing_payments的paid_periods，更新对应的billings记录为已缴费
 */

const crypto = require('crypto');

const DIRECTUS_URL = 'http://localhost:8055';
const DIRECTUS_TOKEN = 'sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n';
const OWNER_ID = process.argv[2] || 'b13a6242-b5d2-4bdd-93e2-d1694b51cad9'; // 赵宸睿

function generateUUID() {
  return crypto.randomUUID();
}

async function fetchDirectus(endpoint, method = 'GET', body = null) {
  const url = `${DIRECTUS_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

async function main() {
  console.log('========================================');
  console.log('同步缴费记录到账单表');
  console.log('========================================');
  console.log(`业主ID: ${OWNER_ID}`);
  console.log('');

  // 1. 获取缴费记录
  const paymentsResult = await fetchDirectus(
    `/items/billing_payments?filter[owner_id][_eq]=${OWNER_ID}&fields=id,amount,paid_at,paid_periods&sort=-paid_at`
  );

  const payments = paymentsResult.data || [];

  if (payments.length === 0) {
    console.log('❌ 没有找到缴费记录');
    return;
  }

  console.log(`找到 ${payments.length} 条缴费记录`);
  console.log('');

  // 收集所有已缴费的月份
  const allPaidPeriods = new Set();
  let latestPaidAt = null;

  for (const payment of payments) {
    if (payment.paid_periods && Array.isArray(payment.paid_periods)) {
      payment.paid_periods.forEach(p => allPaidPeriods.add(p));
      if (!latestPaidAt || new Date(payment.paid_at) > new Date(latestPaidAt)) {
        latestPaidAt = payment.paid_at;
      }
    }
  }

  console.log(`已缴费月份: ${Array.from(allPaidPeriods).sort().join(', ')}`);
  console.log(`最后缴费时间: ${latestPaidAt}`);
  console.log('');

  // 2. 获取现有账单
  const billingsResult = await fetchDirectus(
    `/items/billings?filter[owner_id][_eq]=${OWNER_ID}&fields=id,period,amount,is_paid,community_id,building_id&sort=period`
  );

  const billings = billingsResult.data || [];
  console.log(`找到 ${billings.length} 条现有账单`);
  console.log('');

  // 获取第一条账单的基本信息（用于创建新账单）
  const templateBilling = billings[0];
  if (!templateBilling) {
    console.log('❌ 没有找到账单模板');
    return;
  }

  const monthlyAmount = templateBilling.amount;
  const communityId = templateBilling.community_id;
  const buildingId = templateBilling.building_id;

  // 3. 更新现有账单
  console.log('步骤1: 更新现有账单...');
  let updatedCount = 0;

  for (const billing of billings) {
    if (allPaidPeriods.has(billing.period)) {
      // 应该标记为已缴费
      if (!billing.is_paid) {
        await fetchDirectus(`/items/billings/${billing.id}`, 'PATCH', {
          is_paid: true,
          paid_at: latestPaidAt
        });
        console.log(`  ✅ 更新 ${billing.period} 为已缴费`);
        updatedCount++;
      }
    }
  }

  console.log(`已更新 ${updatedCount} 条账单`);
  console.log('');

  // 4. 创建缺失的账单
  console.log('步骤2: 创建缺失的账单...');
  const existingPeriods = new Set(billings.map(b => b.period));
  const missingPeriods = Array.from(allPaidPeriods).filter(p => !existingPeriods.has(p));

  let createdCount = 0;
  for (const period of missingPeriods) {
    await fetchDirectus('/items/billings', 'POST', {
      id: generateUUID(),
      owner_id: OWNER_ID,
      community_id: communityId,
      building_id: buildingId,
      period: period,
      amount: monthlyAmount,
      is_paid: true,
      paid_at: latestPaidAt
    });
    console.log(`  ✅ 创建 ${period} 账单（已缴费）`);
    createdCount++;
  }

  console.log(`已创建 ${createdCount} 条账单`);
  console.log('');

  // 5. 验证结果
  console.log('步骤3: 验证同步结果...');
  const verifyResult = await fetchDirectus(
    `/items/billings?filter[owner_id][_eq]=${OWNER_ID}&fields=period,is_paid&sort=period`
  );

  const verifyBillings = verifyResult.data || [];
  console.log('');
  console.log('最终账单状态:');
  verifyBillings.forEach(b => {
    const status = b.is_paid ? '✅已缴' : '❌欠费';
    console.log(`  ${b.period}: ${status}`);
  });

  const paidCount = verifyBillings.filter(b => b.is_paid).length;
  console.log('');
  console.log(`总账单数: ${verifyBillings.length}`);
  console.log(`已缴数: ${paidCount}`);
  console.log(`欠费数: ${verifyBillings.length - paidCount}`);

  console.log('');
  console.log('========================================');
  console.log('✅ 同步完成！');
  console.log('========================================');
}

main().catch(console.error);
