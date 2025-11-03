#!/usr/bin/env node

/**
 * 重新创建 parking_spots 的 community_id 和 building_id 字段
 * 包含正确的外键关系
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

  const response = await fetch(url, options);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

async function createFieldWithRelation(collection, fieldName, relatedCollection, isNullable = false, note = '') {
  console.log(`\n创建字段: ${collection}.${fieldName}`);
  console.log('----------------------------------------');

  // 步骤1: 创建字段
  console.log('步骤1: 创建字段...');
  const fieldData = {
    field: fieldName,
    type: 'uuid',
    schema: {
      is_nullable: isNullable
    },
    meta: {
      interface: 'select-dropdown-m2o',
      special: ['m2o'],
      note: note,
      width: 'half'
    }
  };

  try {
    await fetchDirectus(`/fields/${collection}`, 'POST', fieldData);
    console.log('✅ 字段创建成功');
  } catch (error) {
    console.log(`⚠️  字段创建失败（可能已存在）: ${error.message}`);
  }

  // 步骤2: 创建关系
  console.log('步骤2: 创建关系...');
  const relationData = {
    collection: collection,
    field: fieldName,
    related_collection: relatedCollection
  };

  try {
    const result = await fetchDirectus('/relations', 'POST', relationData);
    console.log('✅ 关系创建成功');
    console.log(`   外键约束: ${result.data.schema.constraint_name}`);
    console.log(`   ${collection}.${fieldName} -> ${relatedCollection}.id`);
  } catch (error) {
    console.log(`❌ 关系创建失败: ${error.message}`);
    throw error;
  }

  // 步骤3: 验证
  console.log('步骤3: 验证配置...');
  const field = await fetchDirectus(`/fields/${collection}/${fieldName}`);
  const fkTable = field.data.schema.foreign_key_table;
  const fkColumn = field.data.schema.foreign_key_column;

  if (fkTable && fkColumn) {
    console.log('✅ 验证通过');
    console.log(`   foreign_key_table: ${fkTable}`);
    console.log(`   foreign_key_column: ${fkColumn}`);
  } else {
    console.log('❌ 验证失败：外键未正确设置');
  }
}

async function main() {
  console.log('========================================');
  console.log('重新创建 parking_spots 外键字段');
  console.log('========================================');
  console.log('');
  console.log('目标字段:');
  console.log('  1. community_id -> communities');
  console.log('  2. building_id -> buildings');
  console.log('');

  try {
    // 创建 community_id (必填)
    await createFieldWithRelation(
      'parking_spots',
      'community_id',
      'communities',
      false, // NOT NULL
      '所属小区'
    );

    // 创建 building_id (可选)
    await createFieldWithRelation(
      'parking_spots',
      'building_id',
      'buildings',
      true, // NULLABLE
      '所属楼栋（可选）'
    );

    console.log('');
    console.log('========================================');
    console.log('✅ 全部完成！');
    console.log('========================================');
    console.log('');
    console.log('请在 Directus 后台检查:');
    console.log('  1. parking_spots 表的 community_id 字段');
    console.log('  2. parking_spots 表的 building_id 字段');
    console.log('  3. 确认可以正常选择关联的 community 和 building');
    console.log('');

  } catch (error) {
    console.log('');
    console.log('========================================');
    console.log('❌ 创建失败');
    console.log('========================================');
    console.log('错误:', error.message);
    process.exit(1);
  }
}

main();
