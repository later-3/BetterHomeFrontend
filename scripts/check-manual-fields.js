#!/usr/bin/env node

/**
 * 检查用户手动创建的 community_id 和 building_id 字段
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

async function checkField(collection, fieldName) {
  console.log(`\n📋 检查字段: ${collection}.${fieldName}`);
  console.log('='.repeat(60));

  try {
    const result = await fetchDirectus(`/fields/${collection}/${fieldName}`);
    const field = result.data;

    console.log(`字段名: ${field.field}`);
    console.log(`类型: ${field.type}`);
    console.log(`接口: ${field.meta.interface}`);
    console.log(`special: ${JSON.stringify(field.meta.special)}`);
    console.log(`外键表: ${field.schema.foreign_key_table || '❌ 未设置'}`);
    console.log(`外键列: ${field.schema.foreign_key_column || '❌ 未设置'}`);
    console.log(`is_nullable: ${field.schema.is_nullable}`);
    console.log(`required: ${field.meta.required || false}`);

    const isCorrect = field.schema.foreign_key_table !== null &&
                      field.schema.foreign_key_column !== null &&
                      field.meta.interface === 'select-dropdown-m2o' &&
                      field.meta.special && field.meta.special.includes('m2o');

    if (isCorrect) {
      console.log('\n✅ 配置正确！');
    } else {
      console.log('\n❌ 配置有问题：');
      if (!field.schema.foreign_key_table) {
        console.log('  - 缺少外键表配置');
      }
      if (!field.meta.special || !field.meta.special.includes('m2o')) {
        console.log('  - 缺少 m2o special 配置');
      }
    }
  } catch (error) {
    console.log(`❌ 字段不存在或访问出错: ${error.message}`);
  }
}

async function checkRelation(collection, fieldName) {
  console.log(`\n🔗 检查关系: ${collection}.${fieldName}`);
  console.log('='.repeat(60));

  try {
    const result = await fetchDirectus('/relations');
    const relation = result.data.find(r =>
      r.many_collection === collection && r.many_field === fieldName
    );

    if (relation) {
      console.log('✅ 找到关系配置：');
      console.log(`  many_collection: ${relation.many_collection}`);
      console.log(`  many_field: ${relation.many_field}`);
      console.log(`  one_collection: ${relation.one_collection}`);
      if (relation.schema) {
        console.log(`  constraint_name: ${relation.schema.constraint_name}`);
        console.log(`  foreign_key_table: ${relation.schema.foreign_key_table}`);
        console.log(`  foreign_key_column: ${relation.schema.foreign_key_column}`);
      }
    } else {
      console.log('❌ 未找到关系配置');
    }
  } catch (error) {
    console.log(`❌ 检查关系出错: ${error.message}`);
  }
}

async function main() {
  console.log('========================================');
  console.log('检查手动创建的字段');
  console.log('========================================');

  // 检查 community_id
  await checkField('parking_spots', 'community_id');
  await checkRelation('parking_spots', 'community_id');

  // 检查 building_id
  await checkField('parking_spots', 'building_id');
  await checkRelation('parking_spots', 'building_id');

  console.log('\n========================================');
  console.log('检查完成');
  console.log('========================================');
}

main().catch(console.error);
