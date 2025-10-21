#!/usr/bin/env node

/**
 * 为所有收益管理相关表创建外键关系
 *
 * 这个脚本应该在创建表之后运行，用于建立所有UUID外键字段的关系
 */

const DIRECTUS_URL = 'http://localhost:8055';
const DIRECTUS_TOKEN = 'sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n';

// 定义所有需要创建的关系
const RELATIONS = [
  // receivables 表
  { collection: 'receivables', field: 'community_id', related_collection: 'communities', note: '应收-社区' },
  { collection: 'receivables', field: 'owner_id', related_collection: 'directus_users', note: '应收-用户' },
  { collection: 'receivables', field: 'payment_id', related_collection: 'payments', note: '应收-缴费' },

  // payments 表
  { collection: 'payments', field: 'community_id', related_collection: 'communities', note: '缴费-社区' },
  { collection: 'payments', field: 'owner_id', related_collection: 'directus_users', note: '缴费-用户' },

  // parking_spots 表
  { collection: 'parking_spots', field: 'community_id', related_collection: 'communities', note: '停车位-社区' },
  { collection: 'parking_spots', field: 'building_id', related_collection: 'buildings', note: '停车位-楼栋' },
  { collection: 'parking_spots', field: 'owner_id', related_collection: 'directus_users', note: '停车位-业主' },
  { collection: 'parking_spots', field: 'renter_id', related_collection: 'directus_users', note: '停车位-租户' },

  // parking_details 表
  { collection: 'parking_details', field: 'parking_spot_id', related_collection: 'parking_spots', note: '停车详情-停车位' },

  // parking_temp_records 表
  { collection: 'parking_temp_records', field: 'community_id', related_collection: 'communities', note: '临停-社区' },
  { collection: 'parking_temp_records', field: 'payment_id', related_collection: 'payments', note: '临停-缴费' },
  { collection: 'parking_temp_records', field: 'operator_id', related_collection: 'directus_users', note: '临停-操作员' },

  // ad_spots 表
  { collection: 'ad_spots', field: 'community_id', related_collection: 'communities', note: '广告位-社区' },
  { collection: 'ad_spots', field: 'current_contract_id', related_collection: 'ad_contracts', note: '广告位-当前合同' },

  // ad_contracts 表
  { collection: 'ad_contracts', field: 'community_id', related_collection: 'communities', note: '广告合同-社区' },
  { collection: 'ad_contracts', field: 'spot_id', related_collection: 'ad_spots', note: '广告合同-广告位' },

  // ad_details 表
  { collection: 'ad_details', field: 'spot_id', related_collection: 'ad_spots', note: '广告详情-广告位' },
  { collection: 'ad_details', field: 'contract_id', related_collection: 'ad_contracts', note: '广告详情-合同' },
  { collection: 'ad_details', field: 'receivable_id', related_collection: 'receivables', note: '广告详情-应收' },
  { collection: 'ad_details', field: 'payment_id', related_collection: 'payments', note: '广告详情-缴费' },
];

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
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

async function createRelation(relation) {
  const { collection, field, related_collection, note } = relation;

  try {
    const relationData = {
      collection,
      field,
      related_collection
    };

    const result = await fetchDirectus('/relations', 'POST', relationData);
    console.log(`✅ ${note}: ${collection}.${field} -> ${related_collection}`);
    return { success: true, relation };
  } catch (error) {
    // 如果关系已存在，不算错误
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log(`⚠️  ${note}: 关系已存在，跳过`);
      return { success: true, relation, skipped: true };
    } else {
      console.log(`❌ ${note}: ${error.message}`);
      return { success: false, relation, error: error.message };
    }
  }
}

async function main() {
  console.log('========================================');
  console.log('创建所有外键关系');
  console.log('========================================');
  console.log('');
  console.log(`📍 Directus URL: ${DIRECTUS_URL}`);
  console.log(`📊 需要创建 ${RELATIONS.length} 个关系`);
  console.log('');

  const results = {
    success: [],
    skipped: [],
    failed: []
  };

  // 按表分组显示
  let currentCollection = '';

  for (const relation of RELATIONS) {
    if (relation.collection !== currentCollection) {
      currentCollection = relation.collection;
      console.log(`\n📋 ${currentCollection}`);
      console.log('─'.repeat(60));
    }

    const result = await createRelation(relation);

    if (result.success) {
      if (result.skipped) {
        results.skipped.push(result.relation);
      } else {
        results.success.push(result.relation);
      }
    } else {
      results.failed.push({ relation: result.relation, error: result.error });
    }

    // 稍微延迟，避免请求太快
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('');
  console.log('========================================');
  console.log('创建完成');
  console.log('========================================');
  console.log('');
  console.log(`✅ 成功创建: ${results.success.length} 个`);
  console.log(`⚠️  已存在跳过: ${results.skipped.length} 个`);
  console.log(`❌ 失败: ${results.failed.length} 个`);
  console.log('');

  if (results.failed.length > 0) {
    console.log('失败的关系：');
    results.failed.forEach(({ relation, error }) => {
      console.log(`  - ${relation.collection}.${relation.field}: ${error}`);
    });
    console.log('');
  }

  // 验证部分字段
  console.log('========================================');
  console.log('验证部分字段');
  console.log('========================================');
  console.log('');

  const samplesToCheck = [
    { collection: 'receivables', field: 'community_id' },
    { collection: 'parking_spots', field: 'owner_id' },
    { collection: 'ad_contracts', field: 'spot_id' }
  ];

  for (const sample of samplesToCheck) {
    try {
      const field = await fetchDirectus(`/fields/${sample.collection}/${sample.field}`);
      const fkTable = field.data.schema.foreign_key_table;
      const fkColumn = field.data.schema.foreign_key_column;

      if (fkTable && fkColumn) {
        console.log(`✅ ${sample.collection}.${sample.field}: ${fkTable}.${fkColumn}`);
      } else {
        console.log(`❌ ${sample.collection}.${sample.field}: 外键未设置`);
      }
    } catch (error) {
      console.log(`❌ ${sample.collection}.${sample.field}: ${error.message}`);
    }
  }

  console.log('');
  console.log('========================================');
  console.log('🎉 全部完成！');
  console.log('========================================');
  console.log('');

  if (results.failed.length > 0) {
    process.exit(1);
  }
}

main();
