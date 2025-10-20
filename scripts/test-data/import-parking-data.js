#!/usr/bin/env node

/**
 * 停车费测试数据导入器
 *
 * 用法：
 *   node import-parking-data.js [local|remote]
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, 'parking-data-generated.json');

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

console.log('========================================');
console.log('停车费测试数据导入');
console.log('========================================');
console.log('');
console.log(`📍 环境: ${env}`);
console.log(`📍 Directus URL: ${directus.url}`);
console.log('');

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

// 批量导入
async function batchImport(collection, items, batchSize = 50) {
  console.log(`➡️  导入 ${collection}...`);
  let imported = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    try {
      await fetchDirectus(`/items/${collection}`, 'POST', batch);
      imported += batch.length;
      process.stdout.write(`   已导入 ${imported}/${items.length}...\r`);
    } catch (error) {
      console.error(`\n   ❌ 批次 ${i}-${i + batch.length} 失败: ${error.message}`);
      throw error;
    }
  }

  console.log(`   ✅ 已导入 ${imported}/${items.length}`);
  return imported;
}

async function main() {
  try {
    // 1. 读取生成的数据
    console.log('📖 读取数据文件...');
    if (!fs.existsSync(INPUT_FILE)) {
      console.error(`❌ 数据文件不存在: ${INPUT_FILE}`);
      console.log('请先运行: node generate-parking-data.js');
      process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
    console.log(`✅ 数据文件读取成功`);
    console.log(`   生成时间: ${data.metadata.generated_at}`);
    console.log('');

    // 2. 显示统计
    console.log('📊 数据统计:');
    console.log(`   - 停车位: ${data.statistics.total_spots}`);
    console.log(`   - 详情记录: ${data.data.parking_details.length}`);
    console.log(`   - 应收账单: ${data.statistics.total_receivables}`);
    console.log(`   - 缴费记录: ${data.statistics.total_payments + data.statistics.temp_payments}`);
    console.log(`   - 临停记录: ${data.statistics.temp_records}`);
    console.log('');

    // 3. 导入顺序（按依赖关系）
    console.log('========================================');
    console.log('开始导入数据');
    console.log('========================================');
    console.log('');

    // 3.1 导入停车位
    console.log('步骤1: 导入停车位');
    await batchImport('parking_spots', data.data.parking_spots, 50);
    console.log('');

    // 3.2 导入详情记录
    console.log('步骤2: 导入停车费详情');
    await batchImport('parking_details', data.data.parking_details, 100);
    console.log('');

    // 3.3 导入缴费记录（必须在应收账单之前导入，因为应收账单引用了缴费记录）
    console.log('步骤3: 导入缴费记录');
    await batchImport('payments', data.data.payments, 100);
    console.log('');

    // 3.4 导入应收账单
    console.log('步骤4: 导入应收账单');
    await batchImport('receivables', data.data.receivables, 100);
    console.log('');

    // 3.5 导入临停记录
    console.log('步骤5: 导入临停记录');
    await batchImport('parking_temp_records', data.data.parking_temp_records, 100);
    console.log('');

    // 4. 验证导入结果
    console.log('========================================');
    console.log('验证导入结果');
    console.log('========================================');
    console.log('');

    const spotsResult = await fetchDirectus('/items/parking_spots?aggregate[count]=*');
    const detailsResult = await fetchDirectus('/items/parking_details?aggregate[count]=*');
    const receivablesResult = await fetchDirectus('/items/receivables?filter[type_code][_in]=parking_management,parking_rent&aggregate[count]=*');
    const paymentsResult = await fetchDirectus('/items/payments?filter[type_code][_in]=parking_management,parking_rent,parking_temp&aggregate[count]=*');
    const tempRecordsResult = await fetchDirectus('/items/parking_temp_records?aggregate[count]=*');

    console.log(`✅ 停车位: ${spotsResult.data[0].count} 条`);
    console.log(`✅ 详情记录: ${detailsResult.data[0].count} 条`);
    console.log(`✅ 应收账单: ${receivablesResult.data[0].count} 条`);
    console.log(`✅ 缴费记录: ${paymentsResult.data[0].count} 条`);
    console.log(`✅ 临停记录: ${tempRecordsResult.data[0].count} 条`);

    console.log('');
    console.log('========================================');
    console.log('✅ 导入完成！');
    console.log('========================================');
    console.log('');
    console.log('🔗 访问 Directus Admin 查看数据:');
    console.log(`   ${directus.url}/admin`);
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ 错误:', error.message);
    console.error('');
    process.exit(1);
  }
}

main();
