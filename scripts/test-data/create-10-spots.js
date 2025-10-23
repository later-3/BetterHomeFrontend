const crypto = require('crypto');

const DIRECTUS_URL = 'http://localhost:8055';
const DIRECTUS_ADMIN_TOKEN = 'sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n';

async function fetchDirectus(path, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${DIRECTUS_ADMIN_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${DIRECTUS_URL}${path}`, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return response.json();
}

async function create10AdSpots() {
  console.log('========================================');
  console.log('创建10个广告位');
  console.log('========================================\n');

  // 获取社区ID
  const communities = await fetchDirectus('/items/communities?limit=1');
  const communityId = communities.data[0].id;
  console.log(`社区: ${communities.data[0].name}\n`);

  // 创建6个电梯广告位
  console.log('创建电梯广告位...');
  for (let building = 1; building <= 3; building++) {
    for (let unit = 1; unit <= 2; unit++) {
      const adSpot = {
        id: crypto.randomUUID(),
        community_id: communityId,
        spot_code: `AD-${building}-${unit}-ELEVATOR`,
        spot_type: 'elevator',
        location: `${building}号楼${unit}单元电梯`,
        floor: '1-18层',
        size_spec: '60cm×90cm',
        base_price_monthly: '300.00',
        status: 'available',
        current_contract_id: null,
        notes: null
      };
      await fetchDirectus('/items/ad_spots', 'POST', adSpot);
      console.log(`  ✅ ${adSpot.spot_code}: ${adSpot.location}`);
    }
  }

  // 创建4个闸机广告位
  console.log('\n创建闸机广告位...');
  const gates = ['东门', '西门', '南门', '北门'];
  for (let i = 0; i < 4; i++) {
    const adSpot = {
      id: crypto.randomUUID(),
      community_id: communityId,
      spot_code: `AD-GATE-${i + 1}`,
      spot_type: 'gate',
      location: `小区${gates[i]}闸机`,
      floor: null,
      size_spec: '120cm×180cm',
      base_price_monthly: '500.00',
      status: 'available',
      current_contract_id: null,
      notes: null
    };
    await fetchDirectus('/items/ad_spots', 'POST', adSpot);
    console.log(`  ✅ ${adSpot.spot_code}: ${adSpot.location}`);
  }

  console.log('\n========================================');
  console.log('✅ 创建完成！共10个广告位');
  console.log('========================================');
  console.log('  - 电梯广告: 6个');
  console.log('  - 闸机广告: 4个');
}

create10AdSpots().catch(err => {
  console.error('❌ 创建失败:', err.message);
  process.exit(1);
});
