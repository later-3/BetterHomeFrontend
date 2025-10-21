#!/usr/bin/env node

/**
 * 检查所有表的UUID外键字段配置
 */

const DIRECTUS_URL = 'http://localhost:8055';
const DIRECTUS_TOKEN = 'sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n';

async function fetchDirectus(endpoint) {
  const response = await fetch(`${DIRECTUS_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${DIRECTUS_TOKEN}`
    }
  });
  return response.json();
}

async function checkTable(tableName) {
  console.log(`\n📋 检查表: ${tableName}`);
  console.log('='.repeat(60));

  const result = await fetchDirectus(`/fields/${tableName}`);
  const uuidFields = result.data.filter(f => f.type === 'uuid' && f.field !== 'id');

  for (const field of uuidFields) {
    const hasForeignKey = field.schema.foreign_key_table !== null;
    const status = hasForeignKey ? '✅' : '❌';

    console.log(`${status} ${field.field}`);
    console.log(`   类型: ${field.type}`);
    console.log(`   外键表: ${field.schema.foreign_key_table || '未设置'}`);
    console.log(`   外键列: ${field.schema.foreign_key_column || '未设置'}`);
    console.log(`   接口: ${field.meta.interface}`);
    console.log(`   special: ${JSON.stringify(field.meta.special)}`);
    console.log('');
  }
}

async function main() {
  console.log('========================================');
  console.log('UUID外键字段配置检查');
  console.log('========================================');

  // 检查核心表
  console.log('\n🔷 核心表');
  await checkTable('receivables');
  await checkTable('payments');

  // 检查停车费相关表
  console.log('\n🔷 停车费相关表');
  await checkTable('parking_spots');
  await checkTable('parking_details');
  await checkTable('parking_temp_records');

  // 检查广告收益相关表
  console.log('\n🔷 广告收益相关表');
  await checkTable('ad_spots');
  await checkTable('ad_contracts');
  await checkTable('ad_details');

  console.log('\n========================================');
  console.log('检查完成');
  console.log('========================================');
}

main().catch(console.error);
