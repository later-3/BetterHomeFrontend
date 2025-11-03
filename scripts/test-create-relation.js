#!/usr/bin/env node

/**
 * 测试创建relation的方法
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
    options.body = JSON.stringify(body, null, 2);
  }

  console.log(`\n${method} ${endpoint}`);
  if (body) {
    console.log('Body:', JSON.stringify(body, null, 2));
  }

  const response = await fetch(url, options);
  const text = await response.text();

  console.log(`Status: ${response.status}`);

  if (!response.ok) {
    console.log('Error:', text);
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

async function main() {
  console.log('========================================');
  console.log('测试创建 relation');
  console.log('========================================');

  try {
    // 方法1: 通过 /relations API 创建
    console.log('\n方法1: 使用 /relations API');
    console.log('----------------------------------------');

    const relationData = {
      collection: 'parking_spots',
      field: 'community_id',
      related_collection: 'communities'
    };

    const result = await fetchDirectus('/relations', 'POST', relationData);
    console.log('✅ 成功创建 relation！');
    console.log('返回:', JSON.stringify(result, null, 2));

    // 验证
    console.log('\n验证结果:');
    console.log('----------------------------------------');
    const field = await fetchDirectus('/fields/parking_spots/community_id');
    console.log('字段配置:');
    console.log(`  foreign_key_table: ${field.data.schema.foreign_key_table || '未设置'}`);
    console.log(`  foreign_key_column: ${field.data.schema.foreign_key_column || '未设置'}`);

  } catch (error) {
    console.log('\n❌ 失败:', error.message);
  }

  console.log('\n========================================');
}

main();
