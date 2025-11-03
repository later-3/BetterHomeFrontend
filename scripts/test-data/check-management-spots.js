#!/usr/bin/env node

/**
 * 统计有多少车位收管理费
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
  console.log('统计收管理费的车位数量');
  console.log('========================================');
  console.log('');

  // 1. 查询所有 parking_details 记录，按 fee_type 分组
  const allDetails = await fetchDirectus('/items/parking_details?limit=-1&fields=id,fee_type,parking_spot_id');

  const managementDetails = allDetails.data.filter(d => d.fee_type === 'management');
  const rentDetails = allDetails.data.filter(d => d.fee_type === 'rent');

  console.log('📊 parking_details 表统计:');
  console.log(`   总记录数: ${allDetails.data.length}`);
  console.log(`   管理费 (fee_type='management'): ${managementDetails.length} 个车位`);
  console.log(`   租金 (fee_type='rent'): ${rentDetails.length} 个车位`);
  console.log('');

  // 2. 获取所有停车位总数
  const allSpots = await fetchDirectus('/items/parking_spots?aggregate[count]=*');
  const totalSpots = allSpots.data[0].count;

  console.log('📊 parking_spots 表统计:');
  console.log(`   停车位总数: ${totalSpots}`);
  console.log('');

  // 3. 显示部分管理费车位详情
  if (managementDetails.length > 0) {
    console.log('📋 管理费车位详情（前10个）:');
    console.log('─'.repeat(60));

    const spotIds = managementDetails.slice(0, 10).map(d =>
      typeof d.parking_spot_id === 'string' ? d.parking_spot_id : d.parking_spot_id?.id
    ).filter(Boolean);

    const spots = await fetchDirectus(`/items/parking_spots?filter[id][_in]=${spotIds.join(',')}&fields=id,spot_number,monthly_management_fee`);

    spots.data.forEach((spot, index) => {
      console.log(`   ${index + 1}. ${spot.spot_number} - 月管理费: ¥${spot.monthly_management_fee || 0}`);
    });

    if (managementDetails.length > 10) {
      console.log(`   ... 还有 ${managementDetails.length - 10} 个车位`);
    }
  }

  console.log('');
  console.log('========================================');
  console.log('统计完成');
  console.log('========================================');
}

main().catch(console.error);
