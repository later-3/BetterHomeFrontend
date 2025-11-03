#!/usr/bin/env node

/**
 * 修复 parking_details.parking_spot_id 字段
 * 参考用户手动创建成功的方式
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
  console.log('修复 parking_details.parking_spot_id');
  console.log('========================================');
  console.log('');

  try {
    // 步骤1: 检查当前字段配置
    console.log('步骤1: 检查当前字段配置');
    console.log('----------------------------------------');

    const currentField = await fetchDirectus('/fields/parking_details/parking_spot_id');
    console.log('当前配置:');
    console.log(`  类型: ${currentField.data.type}`);
    console.log(`  接口: ${currentField.data.meta.interface}`);
    console.log(`  special: ${JSON.stringify(currentField.data.meta.special)}`);
    console.log(`  外键表: ${currentField.data.schema.foreign_key_table || '❌ 未设置'}`);
    console.log(`  外键列: ${currentField.data.schema.foreign_key_column || '❌ 未设置'}`);

    // 步骤2: 更新字段配置
    console.log('\n步骤2: 更新字段配置');
    console.log('----------------------------------------');

    const updateData = {
      type: 'uuid',
      schema: {
        foreign_key_table: 'parking_spots',
        foreign_key_column: 'id'
      },
      meta: {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        note: '关联停车位',
        width: 'half'
      }
    };

    console.log('更新配置:', JSON.stringify(updateData, null, 2));

    await fetchDirectus('/fields/parking_details/parking_spot_id', 'PATCH', updateData);
    console.log('✅ 字段配置已更新');

    // 步骤3: 验证更新结果
    console.log('\n步骤3: 验证更新结果');
    console.log('----------------------------------------');

    const updatedField = await fetchDirectus('/fields/parking_details/parking_spot_id');
    console.log('更新后配置:');
    console.log(`  类型: ${updatedField.data.type}`);
    console.log(`  接口: ${updatedField.data.meta.interface}`);
    console.log(`  special: ${JSON.stringify(updatedField.data.meta.special)}`);
    console.log(`  外键表: ${updatedField.data.schema.foreign_key_table || '❌ 未设置'}`);
    console.log(`  外键列: ${updatedField.data.schema.foreign_key_column || '❌ 未设置'}`);

    const isCorrect = updatedField.data.schema.foreign_key_table === 'parking_spots' &&
                      updatedField.data.schema.foreign_key_column === 'id' &&
                      updatedField.data.meta.interface === 'select-dropdown-m2o' &&
                      updatedField.data.meta.special &&
                      updatedField.data.meta.special.includes('m2o');

    console.log('');
    if (isCorrect) {
      console.log('✅ 配置验证通过！');
    } else {
      console.log('❌ 配置验证失败');
    }

    console.log('');
    console.log('========================================');
    console.log('✅ 修复完成！');
    console.log('========================================');
    console.log('');
    console.log('请在 Directus 后台测试:');
    console.log('  1. 打开 parking_details 表');
    console.log('  2. 编辑一条记录');
    console.log('  3. 检查 parking_spot_id 字段是否显示下拉选择器');
    console.log('  4. 确认可以正常选择停车位');
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
