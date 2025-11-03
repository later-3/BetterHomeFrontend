#!/usr/bin/env node

/**
 * 重新创建 parking_spots 的 community_id 和 building_id 字段
 * 包含正确的外键关系
 * v2: 先创建为nullable，更新数据后再改为required
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
  console.log('重新创建 parking_spots 外键字段');
  console.log('========================================');
  console.log('');

  try {
    // ============================================
    // 1. 创建 community_id 字段（临时设为nullable）
    // ============================================
    console.log('步骤1: 创建 community_id 字段（nullable）');
    console.log('----------------------------------------');

    const communityFieldData = {
      field: 'community_id',
      type: 'uuid',
      schema: {
        is_nullable: true  // 临时设为nullable
      },
      meta: {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        note: '所属小区',
        width: 'half'
      }
    };

    await fetchDirectus('/fields/parking_spots', 'POST', communityFieldData);
    console.log('✅ community_id 字段创建成功');

    // ============================================
    // 2. 创建 community_id 关系
    // ============================================
    console.log('\n步骤2: 创建 community_id 关系');
    console.log('----------------------------------------');

    const communityRelationData = {
      collection: 'parking_spots',
      field: 'community_id',
      related_collection: 'communities'
    };

    const communityResult = await fetchDirectus('/relations', 'POST', communityRelationData);
    console.log('✅ community_id 关系创建成功');
    console.log(`   外键约束: ${communityResult.data.schema.constraint_name}`);

    // ============================================
    // 3. 获取社区ID并更新所有parking_spots
    // ============================================
    console.log('\n步骤3: 更新现有数据的 community_id');
    console.log('----------------------------------------');

    const communities = await fetchDirectus('/items/communities?limit=1');
    if (!communities.data || communities.data.length === 0) {
      throw new Error('未找到社区数据');
    }

    const communityId = communities.data[0].id;
    console.log(`   使用社区ID: ${communityId}`);

    // 获取所有parking_spots
    const spots = await fetchDirectus('/items/parking_spots?limit=-1&fields=id');
    console.log(`   找到 ${spots.data.length} 个停车位`);

    // 批量更新（每次50个）
    const batchSize = 50;
    for (let i = 0; i < spots.data.length; i += batchSize) {
      const batch = spots.data.slice(i, i + batchSize);
      const ids = batch.map(s => s.id);

      await fetchDirectus('/items/parking_spots', 'PATCH', {
        keys: ids,
        data: { community_id: communityId }
      });

      process.stdout.write(`   已更新 ${Math.min(i + batchSize, spots.data.length)}/${spots.data.length}...\r`);
    }
    console.log(`\n✅ 已更新所有停车位的 community_id`);

    // ============================================
    // 4. 将 community_id 改为 required
    // ============================================
    console.log('\n步骤4: 将 community_id 设为必填');
    console.log('----------------------------------------');

    await fetchDirectus('/fields/parking_spots/community_id', 'PATCH', {
      schema: {
        is_nullable: false
      },
      meta: {
        required: true
      }
    });
    console.log('✅ community_id 已设为必填');

    // ============================================
    // 5. 创建 building_id 字段（nullable）
    // ============================================
    console.log('\n步骤5: 创建 building_id 字段（nullable）');
    console.log('----------------------------------------');

    const buildingFieldData = {
      field: 'building_id',
      type: 'uuid',
      schema: {
        is_nullable: true
      },
      meta: {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        note: '所属楼栋（可选）',
        width: 'half'
      }
    };

    await fetchDirectus('/fields/parking_spots', 'POST', buildingFieldData);
    console.log('✅ building_id 字段创建成功');

    // ============================================
    // 6. 创建 building_id 关系
    // ============================================
    console.log('\n步骤6: 创建 building_id 关系');
    console.log('----------------------------------------');

    const buildingRelationData = {
      collection: 'parking_spots',
      field: 'building_id',
      related_collection: 'buildings'
    };

    const buildingResult = await fetchDirectus('/relations', 'POST', buildingRelationData);
    console.log('✅ building_id 关系创建成功');
    console.log(`   外键约束: ${buildingResult.data.schema.constraint_name}`);

    // ============================================
    // 7. 验证
    // ============================================
    console.log('\n步骤7: 验证配置');
    console.log('----------------------------------------');

    const communityField = await fetchDirectus('/fields/parking_spots/community_id');
    const buildingField = await fetchDirectus('/fields/parking_spots/building_id');

    console.log('community_id:');
    console.log(`  ✅ foreign_key_table: ${communityField.data.schema.foreign_key_table}`);
    console.log(`  ✅ foreign_key_column: ${communityField.data.schema.foreign_key_column}`);
    console.log(`  ✅ is_nullable: ${communityField.data.schema.is_nullable}`);
    console.log(`  ✅ required: ${communityField.data.meta.required}`);

    console.log('building_id:');
    console.log(`  ✅ foreign_key_table: ${buildingField.data.schema.foreign_key_table}`);
    console.log(`  ✅ foreign_key_column: ${buildingField.data.schema.foreign_key_column}`);
    console.log(`  ✅ is_nullable: ${buildingField.data.schema.is_nullable}`);

    console.log('');
    console.log('========================================');
    console.log('✅ 全部完成！');
    console.log('========================================');
    console.log('');
    console.log('请在 Directus 后台检查:');
    console.log('  1. parking_spots 表的 community_id 字段（必填）');
    console.log('  2. parking_spots 表的 building_id 字段（可选）');
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
