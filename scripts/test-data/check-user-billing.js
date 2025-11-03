#!/usr/bin/env node

/**
 * 检查指定业主的账单和缴费情况
 */

const DIRECTUS_URL = 'http://localhost:8055';
const DIRECTUS_TOKEN = 'sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n';
const OWNER_ID = process.argv[2] || 'b13a6242-b5d2-4bdd-93e2-d1694b51cad9'; // 赵宸睿

async function fetchDirectus(endpoint) {
  const url = `${DIRECTUS_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

async function main() {
  console.log('========================================');
  console.log('检查业主账单情况');
  console.log('========================================');
  console.log(`业主ID: ${OWNER_ID}`);
  console.log('');

  // 1. 获取账单
  const billingsResult = await fetchDirectus(
    `/items/billings?filter[owner_id][_eq]=${OWNER_ID}&fields=period,amount,is_paid,paid_at&sort=period`
  );

  const billings = billingsResult.data || [];

  console.log('📊 账单情况:');
  billings.forEach(b => {
    const status = b.is_paid ? '✅已缴' : '❌欠费';
    const paidAt = b.paid_at ? new Date(b.paid_at).toLocaleString() : 'N/A';
    console.log(`  ${b.period}: ¥${b.amount} ${status} (缴费时间: ${paidAt})`);
  });

  const paidCount = billings.filter(b => b.is_paid).length;
  console.log('');
  console.log(`总账单数: ${billings.length}`);
  console.log(`已缴数: ${paidCount}`);
  console.log(`欠费数: ${billings.length - paidCount}`);
  console.log('');

  // 2. 获取缴费记录
  const paymentsResult = await fetchDirectus(
    `/items/billing_payments?filter[owner_id][_eq]=${OWNER_ID}&fields=amount,paid_at,paid_periods&sort=-paid_at`
  );

  const payments = paymentsResult.data || [];

  console.log('💰 缴费记录:');
  payments.forEach(p => {
    const paidAt = new Date(p.paid_at).toLocaleString();
    const periods = p.paid_periods ? p.paid_periods.join(', ') : 'N/A';
    console.log(`  ¥${p.amount} - ${paidAt}`);
    console.log(`    缴费月份: ${periods}`);
  });

  console.log('');
  console.log(`总缴费记录数: ${payments.length}`);
  console.log('');

  // 3. 检查上个月的账单状态（判断是否欠费）
  const now = new Date();
  const lastMonth = now.getMonth(); // 0-11，当前月份的上个月
  const lastMonthYear = lastMonth === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const lastMonthValue = lastMonth === 0 ? 12 : lastMonth;
  const lastMonthPeriod = `${lastMonthYear}-${String(lastMonthValue).padStart(2, '0')}`;

  const lastMonthBilling = billings.find(b => b.period === lastMonthPeriod);

  console.log('🔍 欠费判断逻辑:');
  console.log(`  当前月份: ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  console.log(`  上个月: ${lastMonthPeriod}`);

  if (!lastMonthBilling) {
    console.log(`  ❓ 没有找到上个月的账单`);
    console.log(`  判断结果: 未欠费（没有账单记录）`);
  } else {
    console.log(`  上个月账单: ¥${lastMonthBilling.amount} ${lastMonthBilling.is_paid ? '✅已缴' : '❌未缴'}`);
    console.log(`  判断结果: ${lastMonthBilling.is_paid ? '未欠费' : '欠费'}`);
  }

  console.log('');
  console.log('========================================');
}

main().catch(console.error);
