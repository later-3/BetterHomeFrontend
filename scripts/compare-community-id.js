#!/usr/bin/env node

/**
 * 详细比较 payments.community_id 字段的配置
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

async function main() {
  console.log('========================================');
  console.log('详细检查 payments.community_id');
  console.log('========================================');
  console.log('');

  // 检查字段配置
  console.log('📋 字段配置 (Field Configuration)');
  console.log('='.repeat(60));
  const field = await fetchDirectus('/fields/payments/community_id');
  console.log(JSON.stringify(field.data, null, 2));

  console.log('');
  console.log('📋 关系配置 (Relation Configuration)');
  console.log('='.repeat(60));
  const relations = await fetchDirectus('/relations');
  const relation = relations.data.find(r =>
    r.collection === 'payments' && r.field === 'community_id'
  );

  if (relation) {
    console.log(JSON.stringify(relation, null, 2));
  } else {
    console.log('❌ 未找到关系配置');
  }

  console.log('');
  console.log('📋 对比参考：parking_spots.community_id（你手动创建的）');
  console.log('='.repeat(60));
  const refField = await fetchDirectus('/fields/parking_spots/community_id');
  console.log('字段配置:');
  console.log(JSON.stringify(refField.data, null, 2));

  console.log('');
  console.log('关系配置:');
  const refRelation = relations.data.find(r =>
    r.collection === 'parking_spots' && r.field === 'community_id'
  );
  if (refRelation) {
    console.log(JSON.stringify(refRelation, null, 2));
  } else {
    console.log('❌ 未找到关系配置');
  }

  console.log('');
  console.log('========================================');
  console.log('关键差异对比');
  console.log('========================================');

  console.log('\npayments.community_id:');
  console.log(`  meta.interface: ${field.data.meta.interface}`);
  console.log(`  meta.special: ${JSON.stringify(field.data.meta.special)}`);
  console.log(`  meta.options: ${JSON.stringify(field.data.meta.options || null)}`);
  console.log(`  schema.foreign_key_table: ${field.data.schema.foreign_key_table}`);
  console.log(`  schema.foreign_key_column: ${field.data.schema.foreign_key_column}`);

  console.log('\nparking_spots.community_id (参考):');
  console.log(`  meta.interface: ${refField.data.meta.interface}`);
  console.log(`  meta.special: ${JSON.stringify(refField.data.meta.special)}`);
  console.log(`  meta.options: ${JSON.stringify(refField.data.meta.options || null)}`);
  console.log(`  schema.foreign_key_table: ${refField.data.schema.foreign_key_table}`);
  console.log(`  schema.foreign_key_column: ${refField.data.schema.foreign_key_column}`);
}

main().catch(console.error);
