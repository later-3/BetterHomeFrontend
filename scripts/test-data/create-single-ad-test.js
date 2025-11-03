// 创建单条广告收益测试数据
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

async function createSingleAdTest() {
  console.log('========================================');
  console.log('创建单条广告收益测试数据');
  console.log('========================================\n');

  // 获取社区ID
  console.log('1. 获取社区信息...');
  const communities = await fetchDirectus('/items/communities?limit=1');
  const communityId = communities.data[0].id;
  console.log(`   社区: ${communities.data[0].name} (${communityId})\n`);

  // 创建1个广告位
  console.log('2. 创建广告位...');
  const adSpot = {
    id: crypto.randomUUID(),
    community_id: communityId,
    spot_code: 'AD-TEST-001',
    spot_type: 'elevator',
    location: '1号楼电梯',
    floor: '1-18层',
    size_spec: '60cm×90cm',
    base_price_monthly: '300.00',
    status: 'occupied',
    current_contract_id: null,
    notes: '测试广告位'
  };
  await fetchDirectus('/items/ad_spots', 'POST', adSpot);
  console.log(`   ✅ 广告位: ${adSpot.spot_code}\n`);

  // 创建1个合同
  console.log('3. 创建广告合同...');
  const contract = {
    id: crypto.randomUUID(),
    community_id: communityId,
    spot_id: adSpot.id,
    contract_no: 'AD-2025-TEST',
    advertiser_name: '张三',
    advertiser_company: '测试广告公司',
    advertiser_phone: '13800138000',
    advertiser_email: 'test@example.com',
    contract_start: '2025-04-01',
    contract_end: '2025-09-30',
    monthly_rent: '300.00',
    total_amount: '1800.00',
    deposit: '600.00',
    deposit_status: 'paid',
    status: 'active',
    contract_files: [],
    notes: '测试合同：2025年4月-9月，共6个月'
  };
  await fetchDirectus('/items/ad_contracts', 'POST', contract);
  console.log(`   ✅ 合同: ${contract.contract_no}`);
  console.log(`   期间: ${contract.contract_start} ~ ${contract.contract_end}`);
  console.log(`   月租金: ¥${contract.monthly_rent}\n`);

  // 更新广告位的当前合同ID
  console.log('4. 更新广告位当前合同...');
  await fetchDirectus(`/items/ad_spots/${adSpot.id}`, 'PATCH', {
    current_contract_id: contract.id
  });
  console.log(`   ✅ 已关联\n`);

  // 创建 ad_detail
  console.log('5. 创建广告详情...');
  const adDetail = {
    id: crypto.randomUUID(),
    spot_id: adSpot.id,
    contract_id: contract.id,
    receivable_id: null,
    payment_id: null
  };
  await fetchDirectus('/items/ad_details', 'POST', adDetail);
  console.log(`   ✅ Ad Detail ID: ${adDetail.id}\n`);

  // 创建6个月的应收账单（2025-04 到 2025-09）
  console.log('6. 创建应收账单...');
  const months = ['04', '05', '06', '07', '08', '09'];
  const receivables = [];

  for (const month of months) {
    const receivable = {
      id: crypto.randomUUID(),
      community_id: communityId,
      type_code: 'ad_revenue',
      type_detail_id: adDetail.id,
      owner_id: null,
      amount: contract.monthly_rent,
      period: `2025-${month}`,
      due_date: `2025-${month}-05`,
      status: 'unpaid',
      payment_id: null,
      notes: `测试广告公司 - 2025-${month}月租金`
    };
    receivables.push(receivable);
    await fetchDirectus('/items/receivables', 'POST', receivable);
    console.log(`   ✅ 2025-${month}: ¥${receivable.amount}`);
  }

  console.log('\n========================================');
  console.log('✅ 测试数据创建完成！');
  console.log('========================================\n');

  console.log('📊 数据汇总:');
  console.log(`   广告位: ${adSpot.spot_code} (${adSpot.location})`);
  console.log(`   合同: ${contract.contract_no}`);
  console.log(`   期间: ${contract.contract_start} ~ ${contract.contract_end}`);
  console.log(`   月租金: ¥${contract.monthly_rent}`);
  console.log(`   应收账单: ${receivables.length} 条`);
  console.log(`   应收总额: ¥${parseFloat(contract.monthly_rent) * receivables.length}.00`);
  console.log(`   已缴金额: ¥0.00`);
  console.log(`   欠费金额: ¥${parseFloat(contract.monthly_rent) * receivables.length}.00`);
  console.log('\n🔗 查看详情页面:');
  console.log(`   http://localhost:3003/#/pages/ad/ad-spot-detail?id=${adSpot.id}&startPeriod=2025-01&endPeriod=2025-12`);
}

createSingleAdTest().catch(err => {
  console.error('❌ 创建失败:', err.message);
  process.exit(1);
});
