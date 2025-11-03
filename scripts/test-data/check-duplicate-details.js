#!/usr/bin/env node

/**
 * 检查是否有车位有多条 parking_details 记录
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
  console.log('检查 parking_details 重复记录');
  console.log('========================================');
  console.log('');

  // 获取所有 parking_details
  const allDetails = await fetchDirectus('/items/parking_details?limit=-1&fields=id,fee_type,parking_spot_id');

  // 统计每个车位的 parking_details 数量
  const spotCountMap = new Map();

  allDetails.data.forEach(detail => {
    const spotId = typeof detail.parking_spot_id === 'string'
      ? detail.parking_spot_id
      : detail.parking_spot_id?.id;

    if (!spotCountMap.has(spotId)) {
      spotCountMap.set(spotId, []);
    }
    spotCountMap.get(spotId).push(detail);
  });

  // 找出有多条记录的车位
  const duplicateSpots = [];
  spotCountMap.forEach((details, spotId) => {
    if (details.length > 1) {
      duplicateSpots.push({ spotId, count: details.length, details });
    }
  });

  console.log('📊 统计结果:');
  console.log(`   总车位数（去重）: ${spotCountMap.size}`);
  console.log(`   总 parking_details 记录数: ${allDetails.data.length}`);
  console.log(`   有多条记录的车位: ${duplicateSpots.length} 个`);
  console.log('');

  if (duplicateSpots.length > 0) {
    console.log('⚠️  发现重复记录:');
    console.log('─'.repeat(60));

    for (const dup of duplicateSpots.slice(0, 10)) {
      // 获取车位信息
      const spotResult = await fetchDirectus(`/items/parking_spots/${dup.spotId}?fields=spot_number`);
      const spotNumber = spotResult.data.spot_number;

      console.log(`   车位 ${spotNumber} (${dup.spotId}):`);
      dup.details.forEach((detail, index) => {
        console.log(`     ${index + 1}. fee_type=${detail.fee_type}, id=${detail.id}`);
      });
      console.log('');
    }

    if (duplicateSpots.length > 10) {
      console.log(`   ... 还有 ${duplicateSpots.length - 10} 个重复车位`);
    }
  } else {
    console.log('✅ 没有发现重复记录');
  }

  console.log('');
  console.log('📋 每个车位的 parking_details 数量分布:');
  const countDistribution = new Map();
  spotCountMap.forEach((details) => {
    const count = details.length;
    countDistribution.set(count, (countDistribution.get(count) || 0) + 1);
  });

  [...countDistribution.entries()].sort((a, b) => a[0] - b[0]).forEach(([count, num]) => {
    console.log(`   ${count} 条记录: ${num} 个车位`);
  });

  console.log('');
  console.log('========================================');
  console.log('检查完成');
  console.log('========================================');
}

main().catch(console.error);
