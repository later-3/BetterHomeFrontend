#!/usr/bin/env node

/**
 * 修复 parking_details.parking_spot_id 字段 v2
 * 尝试通过 relations API 创建关系
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

async function main() {
  console.log('========================================');
  console.log('修复 parking_details.parking_spot_id v2');
  console.log('========================================');
  console.log('');

  try {
    // 步骤1: 检查当前配置
    console.log('步骤1: 检查当前字段配置');
    console.log('----------------------------------------');

    const currentField = await fetchDirectus('/fields/parking_details/parking_spot_id');
    console.log('当前配置:');
    console.log(`  外键表: ${currentField.data.schema.foreign_key_table || '❌ 未设置'}`);
    console.log(`  外键列: ${currentField.data.schema.foreign_key_column || '❌ 未设置'}`);

    // 步骤2: 尝试通过 relations API 创建关系
    console.log('\n步骤2: 通过 relations API 创建关系');
    console.log('----------------------------------------');

    const relationData = {
      collection: 'parking_details',
      field: 'parking_spot_id',
      related_collection: 'parking_spots'
    };

    console.log('创建关系:', JSON.stringify(relationData, null, 2));

    try {
      const result = await fetchDirectus('/relations', 'POST', relationData);
      console.log('✅ 关系创建成功！');
      console.log(`   外键约束: ${result.data.schema.constraint_name}`);
      console.log(`   ${relationData.collection}.${relationData.field} -> ${relationData.related_collection}.id`);
    } catch (error) {
      console.log(`❌ 关系创建失败: ${error.message}`);

      // 如果是因为关系已存在而失败，继续执行
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('   关系可能已存在，继续验证...');
      } else {
        throw error;
      }
    }

    // 步骤3: 验证结果
    console.log('\n步骤3: 验证结果');
    console.log('----------------------------------------');

    const updatedField = await fetchDirectus('/fields/parking_details/parking_spot_id');
    console.log('更新后配置:');
    console.log(`  外键表: ${updatedField.data.schema.foreign_key_table || '❌ 未设置'}`);
    console.log(`  外键列: ${updatedField.data.schema.foreign_key_column || '❌ 未设置'}`);
    console.log(`  接口: ${updatedField.data.meta.interface}`);
    console.log(`  special: ${JSON.stringify(updatedField.data.meta.special)}`);

    const isCorrect = updatedField.data.schema.foreign_key_table === 'parking_spots' &&
                      updatedField.data.schema.foreign_key_column === 'id';

    console.log('');
    if (isCorrect) {
      console.log('✅ 配置验证通过！');
    } else {
      console.log('⚠️  外键配置仍未设置');
      console.log('');
      console.log('建议：在 Directus 后台手动操作：');
      console.log('  1. 删除 parking_spot_id 字段');
      console.log('  2. 重新创建，选择类型为 "Many to One Relation"');
      console.log('  3. 选择关联集合为 "parking_spots"');
    }

    console.log('');
    console.log('========================================');
    console.log('修复完成');
    console.log('========================================');

  } catch (error) {
    console.log('');
    console.log('========================================');
    console.log('❌ 修复失败');
    console.log('========================================');
    console.log('错误:', error.message);
    process.exit(1);
  }
}

main();
