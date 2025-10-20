#!/usr/bin/env node

/**
 * 删除停车费相关的所有测试数据
 * 包括：parking_temp_records, parking_details, receivables, payments, parking_spots
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

  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function deleteTableData(tableName, typeCode = null) {
  console.log(`\n📋 删除 ${tableName} 表数据...`);
  console.log('─'.repeat(60));

  try {
    // 构建查询条件
    let query = `limit=-1&fields=id`;
    if (typeCode) {
      query += `&filter[type_code][_in]=${typeCode}`;
    }

    // 获取所有记录的ID
    const result = await fetchDirectus(`/items/${tableName}?${query}`);

    if (!result || !result.data || result.data.length === 0) {
      console.log(`   ℹ️  表为空，无需删除`);
      return 0;
    }

    const ids = result.data.map(item => item.id);
    console.log(`   找到 ${ids.length} 条记录`);

    // 批量删除（每次50个）
    const batchSize = 50;
    let deletedCount = 0;

    for (let i = 0; i < ids.length; i += batchSize) {
      const batchIds = ids.slice(i, i + batchSize);

      await fetchDirectus(`/items/${tableName}`, 'DELETE', batchIds);

      deletedCount += batchIds.length;
      process.stdout.write(`   已删除 ${deletedCount}/${ids.length}...\r`);
    }

    console.log(`   ✅ 已删除 ${deletedCount} 条记录`);
    return deletedCount;

  } catch (error) {
    console.log(`   ❌ 删除失败: ${error.message}`);
    return 0;
  }
}

async function main() {
  console.log('========================================');
  console.log('删除停车费相关测试数据');
  console.log('========================================');
  console.log('');
  console.log('⚠️  警告：此操作将删除以下数据：');
  console.log('  1. parking_temp_records (临停记录)');
  console.log('  2. parking_details (停车费详情)');
  console.log('  3. receivables (停车相关应收)');
  console.log('  4. payments (停车相关缴费)');
  console.log('  5. parking_spots (停车位)');
  console.log('');

  // 删除顺序很重要：从最依赖的表开始删除
  const deletionPlan = [
    { table: 'parking_temp_records', typeCode: null, label: '临停记录' },
    { table: 'parking_details', typeCode: null, label: '停车费详情' },
    { table: 'receivables', typeCode: 'parking_management,parking_rent', label: '停车相关应收' },
    { table: 'payments', typeCode: 'parking_management,parking_rent,parking_temp', label: '停车相关缴费' },
    { table: 'parking_spots', typeCode: null, label: '停车位' }
  ];

  const results = {
    total: 0,
    byTable: {}
  };

  for (const plan of deletionPlan) {
    const count = await deleteTableData(plan.table, plan.typeCode);
    results.byTable[plan.table] = count;
    results.total += count;
  }

  console.log('');
  console.log('========================================');
  console.log('删除完成');
  console.log('========================================');
  console.log('');
  console.log(`📊 删除统计：`);
  Object.entries(results.byTable).forEach(([table, count]) => {
    console.log(`   ${table}: ${count} 条`);
  });
  console.log(`   总计: ${results.total} 条`);
  console.log('');
  console.log('✅ 现在可以重新生成测试数据了');
  console.log('   运行: node scripts/test-data/generate-parking-data.js');
  console.log('   然后: node scripts/test-data/import-parking-data.js');
  console.log('');
}

main().catch(error => {
  console.error('');
  console.error('❌ 删除失败:', error.message);
  process.exit(1);
});
