#!/usr/bin/env node

/**
 * 修复 payments.community_id 字段
 * 参考 fix-parking-details-spot-id-v2.js 的成功方法
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
  console.log('修复 payments.community_id');
  console.log('========================================');
  console.log('');

  try {
    // 步骤1: 检查当前配置
    console.log('步骤1: 检查当前字段配置');
    console.log('----------------------------------------');

    const currentField = await fetchDirectus('/fields/payments/community_id');
    console.log('当前配置:');
    console.log(`  外键表: ${currentField.data.schema.foreign_key_table || '❌ 未设置'}`);
    console.log(`  外键列: ${currentField.data.schema.foreign_key_column || '❌ 未设置'}`);
    console.log(`  接口: ${currentField.data.meta.interface}`);
    console.log(`  special: ${JSON.stringify(currentField.data.meta.special)}`);

    // 步骤2: 检查现有关系
    console.log('\n步骤2: 检查现有关系');
    console.log('----------------------------------------');

    try {
      const relations = await fetchDirectus('/relations');
      const existingRelation = relations.data.find(r =>
        r.collection === 'payments' && r.field === 'community_id'
      );

      if (existingRelation) {
        console.log('⚠️  找到现有关系，先删除...');
        console.log(`   关系: ${existingRelation.collection}.${existingRelation.field} -> ${existingRelation.related_collection}`);

        // 删除现有关系
        await fetchDirectus(`/relations/${existingRelation.collection}/${existingRelation.field}`, 'DELETE');
        console.log('✅ 已删除现有关系');
      } else {
        console.log('   未找到现有关系');
      }
    } catch (error) {
      console.log(`   检查关系时出错: ${error.message}`);
    }

    // 步骤3: 通过 relations API 创建关系
    console.log('\n步骤3: 通过 relations API 创建关系');
    console.log('----------------------------------------');

    const relationData = {
      collection: 'payments',
      field: 'community_id',
      related_collection: 'communities'
    };

    console.log('创建关系:', JSON.stringify(relationData, null, 2));

    try {
      const result = await fetchDirectus('/relations', 'POST', relationData);
      console.log('✅ 关系创建成功！');
      if (result.data && result.data.schema && result.data.schema.constraint_name) {
        console.log(`   外键约束: ${result.data.schema.constraint_name}`);
      }
      console.log(`   ${relationData.collection}.${relationData.field} -> ${relationData.related_collection}.id`);
    } catch (error) {
      console.log(`❌ 关系创建失败: ${error.message}`);
      throw error;
    }

    // 步骤4: 验证结果
    console.log('\n步骤4: 验证结果');
    console.log('----------------------------------------');

    const updatedField = await fetchDirectus('/fields/payments/community_id');
    console.log('更新后配置:');
    console.log(`  外键表: ${updatedField.data.schema.foreign_key_table || '❌ 未设置'}`);
    console.log(`  外键列: ${updatedField.data.schema.foreign_key_column || '❌ 未设置'}`);
    console.log(`  接口: ${updatedField.data.meta.interface}`);
    console.log(`  special: ${JSON.stringify(updatedField.data.meta.special)}`);

    const isCorrect = updatedField.data.schema.foreign_key_table === 'communities' &&
                      updatedField.data.schema.foreign_key_column === 'id';

    console.log('');
    if (isCorrect) {
      console.log('✅ 配置验证通过！');
    } else {
      console.log('⚠️  外键配置仍未设置');
    }

    console.log('');
    console.log('========================================');
    console.log('修复完成');
    console.log('========================================');
    console.log('');
    console.log('请在 Directus 后台验证:');
    console.log('  1. 打开 payments 表');
    console.log('  2. 编辑一条记录');
    console.log('  3. 检查 community_id 字段是否显示下拉选择器');
    console.log('  4. 确认可以正常选择社区');
    console.log('');

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
