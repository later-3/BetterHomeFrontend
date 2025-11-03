#!/usr/bin/env node

/**
 * 给billing_payments表添加community_id字段
 */

const DIRECTUS_URL = 'http://localhost:8055';
const DIRECTUS_TOKEN = 'sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n';

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
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json();
}

async function main() {
  console.log('========================================');
  console.log('添加community_id字段到billing_payments表');
  console.log('========================================');
  console.log('');

  // 1. 添加字段
  console.log('步骤1: 添加community_id字段...');
  try {
    await fetchDirectus('/fields/billing_payments', 'POST', {
      field: 'community_id',
      type: 'uuid',
      schema: {
        is_nullable: true,
        foreign_key_table: 'communities',
        foreign_key_column: 'id'
      },
      meta: {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        note: '所属小区',
        width: 'half'
      }
    });
    console.log('✅ community_id字段已添加');
  } catch (e) {
    console.log('⚠️ 字段可能已存在:', e.message);
  }
  console.log('');

  // 2. 获取第一个小区ID（用于填充数据）
  console.log('步骤2: 获取默认小区ID...');
  const communitiesResult = await fetchDirectus('/items/communities?limit=1&fields=id,name');
  const defaultCommunity = communitiesResult.data[0];

  if (!defaultCommunity) {
    console.log('❌ 没有找到小区数据');
    return;
  }

  console.log(`✅ 默认小区: ${defaultCommunity.name} (${defaultCommunity.id})`);
  console.log('');

  // 3. 更新所有billing_payments记录的community_id
  console.log('步骤3: 更新现有记录的community_id...');
  const paymentsResult = await fetchDirectus('/items/billing_payments?fields=id&limit=1000');
  const payments = paymentsResult.data || [];

  console.log(`找到 ${payments.length} 条缴费记录`);

  let updatedCount = 0;
  for (const payment of payments) {
    try {
      await fetchDirectus(`/items/billing_payments/${payment.id}`, 'PATCH', {
        community_id: defaultCommunity.id
      });
      updatedCount++;
      if (updatedCount % 10 === 0) {
        process.stdout.write(`  已更新 ${updatedCount}/${payments.length}...\r`);
      }
    } catch (e) {
      console.error(`  ❌ 更新失败 ${payment.id}:`, e.message);
    }
  }

  console.log(`  ✅ 已更新 ${updatedCount}/${payments.length} 条记录`);
  console.log('');

  // 4. 验证
  console.log('步骤4: 验证结果...');
  const verifyResult = await fetchDirectus('/items/billing_payments?fields=id,community_id&limit=5');
  const samples = verifyResult.data || [];

  console.log('样例数据:');
  samples.forEach(s => {
    const status = s.community_id ? '✅' : '❌';
    console.log(`  ${status} ${s.id.substring(0, 8)}... → community_id: ${s.community_id ? s.community_id.substring(0, 8) + '...' : 'null'}`);
  });

  console.log('');
  console.log('========================================');
  console.log('✅ 完成！');
  console.log('========================================');
}

main().catch(console.error);
