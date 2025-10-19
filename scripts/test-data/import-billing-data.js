#!/usr/bin/env node

/**
 * 财务测试数据导入器
 *
 * 用法：
 *   node import-billing-data.js [local|remote]
 *
 * 功能：
 *   1. 读取生成的JSON数据文件
 *   2. 批量导入到Directus
 *   3. 显示导入进度和结果
 */

const fs = require('fs');
const path = require('path');

// 配置
const DATA_FILE = path.join(__dirname, 'billing-data-generated.json');

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

// 检查数据文件是否存在
if (!fs.existsSync(DATA_FILE)) {
  console.error(`❌ 数据文件不存在: ${DATA_FILE}`);
  console.error('请先运行: node generate-billing-data.js');
  process.exit(1);
}

// 读取数据
const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

console.log('📊 数据概览:');
console.log(`   生成时间: ${data.metadata.generated_at}`);
console.log(`   源环境: ${data.metadata.environment}`);
console.log(`   账单数: ${data.statistics.total_billings}`);
console.log(`   缴费记录数: ${data.statistics.total_payments}`);
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
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return { success: true };
  }
}

// 批量导入（分批处理）
async function batchImport(collection, items, batchSize = 50) {
  console.log(`📦 导入 ${collection} (共 ${items.length} 条)...`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(items.length / batchSize);

    process.stdout.write(`   批次 ${batchNum}/${totalBatches} (${batch.length} 条)... `);

    try {
      // 逐条导入（Directus批量导入有时会有问题）
      for (const item of batch) {
        try {
          await fetchDirectus(`/items/${collection}`, 'POST', item);
          successCount++;
        } catch (error) {
          console.error(`\n   ❌ 导入失败:`, error.message);
          failCount++;
        }
      }
      console.log('✅');
    } catch (error) {
      console.log('❌');
      console.error(`   错误: ${error.message}`);
      failCount += batch.length;
    }

    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`   ✅ 成功: ${successCount}, ❌ 失败: ${failCount}`);
  console.log('');

  return { successCount, failCount };
}

// 清空现有数据（可选）
async function clearExistingData(collection) {
  console.log(`🗑️  清空 ${collection} 表现有数据...`);

  try {
    // 获取所有记录的ID
    const result = await fetchDirectus(`/items/${collection}?fields=id&limit=-1`);
    const ids = result.data.map(item => item.id);

    if (ids.length === 0) {
      console.log(`   ℹ️  ${collection} 表为空，无需清空`);
      return;
    }

    console.log(`   找到 ${ids.length} 条记录`);

    // 逐个删除
    let deleted = 0;
    for (const id of ids) {
      try {
        await fetchDirectus(`/items/${collection}/${id}`, 'DELETE');
        deleted++;
        if (deleted % 10 === 0) {
          process.stdout.write(`\r   已删除: ${deleted}/${ids.length}`);
        }
      } catch (error) {
        // 忽略删除错误
      }
    }

    console.log(`\r   ✅ 已删除: ${deleted}/${ids.length}    `);
  } catch (error) {
    console.error(`   ❌ 清空失败: ${error.message}`);
  }

  console.log('');
}

// 主函数
async function main() {
  try {
    console.log('🚀 开始导入数据...\n');

    // 询问是否清空现有数据
    console.log('⚠️  是否清空现有数据？');
    console.log('   选项: [y]是 / [n]否 (默认: n)');
    console.log('');

    // 简化处理：默认不清空，可以通过参数控制
    const shouldClear = process.argv[3] === '--clear';

    if (shouldClear) {
      await clearExistingData('billing_payments');
      await clearExistingData('billings');
    }

    // 1. 先导入billings（应收）
    const billingsResult = await batchImport('billings', data.data.billings, 50);

    // 2. 再导入billing_payments（实收）
    const paymentsResult = await batchImport('billing_payments', data.data.billing_payments, 50);

    // 3. 总结
    console.log('========================================');
    console.log('✅ 导入完成！');
    console.log('========================================');
    console.log(`billings:         ${billingsResult.successCount} 成功, ${billingsResult.failCount} 失败`);
    console.log(`billing_payments: ${paymentsResult.successCount} 成功, ${paymentsResult.failCount} 失败`);
    console.log('');

    // 4. 验证
    console.log('🔍 验证导入结果...');
    const billingsCheck = await fetchDirectus('/items/billings?limit=1&meta=*');
    const paymentsCheck = await fetchDirectus('/items/billing_payments?limit=1&meta=*');

    console.log(`   billings 表记录数: ${billingsCheck.meta.filter_count}`);
    console.log(`   billing_payments 表记录数: ${paymentsCheck.meta.filter_count}`);
    console.log('');

    console.log('🎉 全部完成！');
    console.log(`   访问 Directus Admin: ${directus.url}/admin`);

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
