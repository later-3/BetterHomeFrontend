const crypto = require('crypto');

const CONTRACT_ID = 'a9977e7a-4276-4b48-ac3e-f07cbda71a1e';
const SPOT_ID = '1b414c4b-d6c9-453b-a90c-3c841e095f6c';
const COMMUNITY_ID = '2a5c769e-9909-4331-99b3-983c8b1175c6';
const MONTHLY_RENT = 300.00;

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

async function createAdDetailsAndReceivables() {
  console.log('========================================');
  console.log('补齐 ad_details 和 receivables 数据');
  console.log('========================================\n');

  // 1. 创建 ad_detail
  console.log('1. 创建 ad_detail...');
  const adDetail = {
    id: crypto.randomUUID(),
    spot_id: SPOT_ID,
    contract_id: CONTRACT_ID,
    receivable_id: null,
    payment_id: null
  };
  await fetchDirectus('/items/ad_details', 'POST', adDetail);
  console.log(`   ✅ Ad Detail ID: ${adDetail.id}\n`);

  // 2. 创建应收账单（2025-04 到 2025-09，共6个月）
  console.log('2. 创建应收账单...');
  const months = ['04', '05', '06', '07', '08', '09'];

  for (const month of months) {
    const receivable = {
      id: crypto.randomUUID(),
      community_id: COMMUNITY_ID,
      type_code: 'ad_revenue',
      type_detail_id: adDetail.id,
      owner_id: null,
      amount: MONTHLY_RENT.toString(),
      period: `2025-${month}`,
      due_date: `2025-${month}-05`,
      status: 'unpaid',
      payment_id: null,
      notes: `测试广告公司 - 2025-${month}月租金`
    };
    await fetchDirectus('/items/receivables', 'POST', receivable);
    console.log(`   ✅ 2025-${month}: ¥${MONTHLY_RENT} (未缴)`);
  }

  console.log('\n========================================');
  console.log('✅ 数据补齐完成！');
  console.log('========================================\n');

  console.log('数据汇总:');
  console.log(`   合同: AD-2025-TEST-001`);
  console.log(`   期间: 2025-04-01 ~ 2025-09-30`);
  console.log(`   月租金: ¥${MONTHLY_RENT}`);
  console.log(`   应收账单: ${months.length} 条`);
  console.log(`   应收总额: ¥${MONTHLY_RENT * months.length}`);
  console.log(`   已缴金额: ¥0`);
  console.log(`   欠费金额: ¥${MONTHLY_RENT * months.length}`);

  console.log('\n🔗 查看页面:');
  console.log(`   http://localhost:3003/#/pages/ad/ad-spot-detail?id=${SPOT_ID}&startPeriod=2025-01&endPeriod=2025-12`);
}

createAdDetailsAndReceivables().catch(err => {
  console.error('❌ 创建失败:', err.message);
  process.exit(1);
});
