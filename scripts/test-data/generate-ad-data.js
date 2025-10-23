#!/usr/bin/env node

/**
 * 广告收益测试数据生成器
 *
 * 用法：
 *   node generate-ad-data.js [local|remote]
 *
 * 功能：
 *   1. 生成广告位数据（电梯广告+闸机广告）
 *   2. 生成广告合同数据
 *   3. 为合同生成应收账单和缴费记录
 *   4. 连接ad_details表
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 配置
const OUTPUT_FILE = path.join(__dirname, 'ad-data-generated.json');

// Directus配置
const env = process.argv[2] || 'local';
const DIRECTUS_CONFIG = {
  local: {
    url: 'http://localhost:8055',
    token: 'sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n'
  },
  remote: {
    url: 'https://www.betterhome.ink',
    token: 'sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n'
  }
};

const directus = DIRECTUS_CONFIG[env];
if (!directus) {
  console.error(`❌ 无效的环境: ${env}，请使用 local 或 remote`);
  process.exit(1);
}

console.log(`🔧 使用环境: ${env}`);
console.log(`📍 Directus URL: ${directus.url}`);
console.log('');

// 配置参数
const CONFIG = {
  // 广告位配置
  buildings: 3,              // 3栋楼
  units_per_building: 2,     // 每栋2个单元
  elevators_per_unit: 1,     // 每单元1个电梯
  gates: 4,                  // 4个闸机位置（主入口、次入口、地库入口、地库出口）

  // 电梯广告规格
  elevator_ad_spec: '60cm×90cm',
  elevator_base_price: 300,  // 电梯广告基础月租金 300元

  // 闸机广告规格
  gate_ad_spec: '120cm×80cm',
  gate_base_price: 500,      // 闸机广告基础月租金 500元

  // 合同配置
  contract_ratio: 0.8,       // 80% 的广告位已出租
  year: 2025,
  months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // 2025年1-10月

  // 缴费情况
  payment_ratio: 0.75,       // 75%已缴费

  // 押金配置
  deposit_ratio: 0.5,        // 50%合同有押金
  deposit_months: 2,         // 押金为2个月租金
};

// HTTP请求封装
async function fetchDirectus(endpoint, method = 'GET', body = null) {
  const url = `${directus.url}${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${directus.token}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json();
}

// 获取社区ID
async function getCommunityId() {
  console.log('📍 获取社区信息...');
  const result = await fetchDirectus('/items/communities?limit=1');

  if (!result.data || result.data.length === 0) {
    throw new Error('未找到社区数据');
  }

  const community = result.data[0];
  console.log(`✅ 社区: ${community.name} (${community.id})`);
  return community.id;
}

// 生成手机号
function generatePhone() {
  const prefixes = ['138', '139', '158', '188', '186'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.random().toString().substring(2, 10);
  return `${prefix}${suffix}`;
}

// 生成邮箱
function generateEmail(name) {
  const domains = ['qq.com', '163.com', '126.com', 'gmail.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const randomNum = Math.floor(Math.random() * 9999);
  return `${name}${randomNum}@${domain}`;
}

// 生成广告主姓名
function generateAdvertiserName() {
  const surnames = ['张', '王', '李', '刘', '陈', '杨', '黄', '赵', '吴', '周'];
  const names = ['强', '伟', '芳', '娜', '敏', '静', '丽', '秀英', '明', '勇'];
  const surname = surnames[Math.floor(Math.random() * surnames.length)];
  const name = names[Math.floor(Math.random() * names.length)];
  return `${surname}${name}`;
}

// 生成公司名称
function generateCompanyName() {
  const types = ['科技', '广告', '传媒', '文化', '营销'];
  const prefixes = ['创新', '智慧', '云端', '数字', '新时代', '天成', '汇通', '鼎盛'];
  const type = types[Math.floor(Math.random() * types.length)];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return `${prefix}${type}有限公司`;
}

// 生成广告位数据
function generateAdSpots(communityId) {
  console.log('📢 生成广告位数据...');

  const spots = [];
  const { buildings, units_per_building, elevators_per_unit, gates,
          elevator_ad_spec, elevator_base_price, gate_ad_spec, gate_base_price } = CONFIG;

  // 1️⃣ 生成电梯广告位
  console.log('\n   === 生成电梯广告位 ===');
  let elevatorCount = 0;
  for (let b = 1; b <= buildings; b++) {
    for (let u = 1; u <= units_per_building; u++) {
      for (let e = 1; e <= elevators_per_unit; e++) {
        elevatorCount++;
        const spotCode = `AD-${b}-${u}-ELEVATOR`;
        const location = `${b}号楼${u}单元电梯`;

        const spot = {
          id: crypto.randomUUID(),
          community_id: communityId,
          spot_code: spotCode,
          spot_type: 'elevator',
          location: location,
          floor: '1-18层',
          size_spec: elevator_ad_spec,
          base_price_monthly: elevator_base_price,
          current_contract_id: null,  // 稍后填充
          status: 'available',
          notes: null
        };

        spots.push(spot);
      }
    }
  }
  console.log(`   生成 ${elevatorCount} 个电梯广告位`);

  // 2️⃣ 生成闸机广告位
  console.log('\n   === 生成闸机广告位 ===');
  const gateLocations = [
    { code: 'GATE-MAIN-IN', name: '主入口闸机' },
    { code: 'GATE-SIDE-IN', name: '次入口闸机' },
    { code: 'GATE-PARKING-IN', name: '地库入口闸机' },
    { code: 'GATE-PARKING-OUT', name: '地库出口闸机' }
  ];

  for (let i = 0; i < gates && i < gateLocations.length; i++) {
    const gateInfo = gateLocations[i];
    const spotCode = `AD-${gateInfo.code}`;

    const spot = {
      id: crypto.randomUUID(),
      community_id: communityId,
      spot_code: spotCode,
      spot_type: 'gate',
      location: gateInfo.name,
      floor: null,
      size_spec: gate_ad_spec,
      base_price_monthly: gate_base_price,
      current_contract_id: null,  // 稍后填充
      status: 'available',
      notes: null
    };

    spots.push(spot);
  }
  console.log(`   生成 ${gates} 个闸机广告位`);

  console.log(`\n✅ 总计生成 ${spots.length} 个广告位`);
  return spots;
}

// 生成广告合同数据
function generateAdContracts(spots, communityId) {
  console.log('\n📝 生成广告合同数据...');

  const contracts = [];
  const { contract_ratio, year, months, deposit_ratio, deposit_months } = CONFIG;

  // 计算需要签约的广告位数量
  const contractCount = Math.floor(spots.length * contract_ratio);
  console.log(`   将为 ${contractCount}/${spots.length} 个广告位生成合同（${(contract_ratio * 100).toFixed(0)}%）`);

  // 随机选择广告位
  const shuffledSpots = [...spots].sort(() => Math.random() - 0.5);
  const selectedSpots = shuffledSpots.slice(0, contractCount);

  for (let i = 0; i < selectedSpots.length; i++) {
    const spot = selectedSpots[i];
    const advertiserName = generateAdvertiserName();
    const companyName = generateCompanyName();
    const phone = generatePhone();
    const email = generateEmail(advertiserName);

    // 合同期限：随机选择6个月或12个月
    const contractMonths = Math.random() > 0.5 ? 12 : 6;
    const startMonth = Math.floor(Math.random() * 4) + 1; // 1-4月开始
    const contractStart = `${year}-${String(startMonth).padStart(2, '0')}-01`;
    const endMonth = startMonth + contractMonths - 1;
    const contractEnd = endMonth > 12
      ? `${year + 1}-${String(endMonth - 12).padStart(2, '0')}-01`
      : `${year}-${String(endMonth).padStart(2, '0')}-28`;

    // 月租金（可能在基础价格上有10%浮动）
    const monthlyRent = Math.round(spot.base_price_monthly * (0.95 + Math.random() * 0.1));
    const totalAmount = monthlyRent * contractMonths;

    // 押金（50%的合同有押金）
    const hasDeposit = Math.random() < deposit_ratio;
    const deposit = hasDeposit ? monthlyRent * deposit_months : 0;
    const depositStatus = hasDeposit ? 'paid' : 'none';

    // 合同编号
    const contractNo = `AD-${year}-${String(i + 1).padStart(4, '0')}`;

    const contract = {
      id: crypto.randomUUID(),
      community_id: communityId,
      spot_id: spot.id,
      contract_no: contractNo,
      advertiser_name: advertiserName,
      advertiser_company: companyName,
      advertiser_phone: phone,
      advertiser_email: email,
      contract_start: contractStart,
      contract_end: contractEnd,
      monthly_rent: monthlyRent,
      total_amount: totalAmount,
      deposit: deposit,
      deposit_status: depositStatus,
      status: 'active',
      contract_files: [],
      notes: null
    };

    contracts.push(contract);

    // 更新广告位状态
    spot.current_contract_id = contract.id;
    spot.status = 'occupied';
  }

  console.log(`✅ 生成 ${contracts.length} 个广告合同`);
  console.log(`   月租金范围: ¥${Math.min(...contracts.map(c => c.monthly_rent))} - ¥${Math.max(...contracts.map(c => c.monthly_rent))}`);
  console.log(`   有押金合同: ${contracts.filter(c => c.deposit > 0).length} 个`);

  return contracts;
}

// 生成ad_details、receivables、payments
function generateBillingData(contracts, communityId) {
  console.log('\n💰 生成账单和缴费数据...');

  const adDetails = [];
  const receivables = [];
  const payments = [];

  const { year, months, payment_ratio } = CONFIG;

  for (const contract of contracts) {
    // 创建ad_detail记录（每个合同1条）
    const adDetail = {
      id: crypto.randomUUID(),
      spot_id: contract.spot_id,
      contract_id: contract.id,
      receivable_id: null,  // 稍后会关联
      payment_id: null      // 稍后会关联
    };
    adDetails.push(adDetail);

    // 计算合同覆盖的月份
    const contractStart = new Date(contract.contract_start);
    const contractEnd = new Date(contract.contract_end);

    const contractMonths = [];
    for (const month of months) {
      // 创建当月的第一天和最后一天
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0); // 下个月的第0天 = 当月最后一天

      // 只要合同期与该月有交集就生成账单
      if (monthStart <= contractEnd && monthEnd >= contractStart) {
        contractMonths.push(month);
      }
    }

    // 为每个月生成应收账单
    for (const month of contractMonths) {
      const period = `${year}-${String(month).padStart(2, '0')}`;
      const dueDate = `${year}-${String(month).padStart(2, '0')}-05`; // 每月5日到期

      const receivable = {
        id: crypto.randomUUID(),
        community_id: communityId,
        type_code: 'ad_revenue',
        type_detail_id: adDetail.id,
        owner_id: null,  // 广告收益没有owner_id（不是业主缴费）
        amount: contract.monthly_rent,
        period: period,
        due_date: dueDate,
        status: 'unpaid',
        payment_id: null,
        notes: `${contract.advertiser_company} - ${period}月租金`
      };
      receivables.push(receivable);
    }
  }

  console.log(`✅ 生成 ${adDetails.length} 条广告详情记录`);
  console.log(`✅ 生成 ${receivables.length} 条应收账单`);

  // 按广告主+合同分组生成缴费记录
  console.log('\n💳 生成缴费记录...');

  // 按contract_id分组receivables
  const receivablesByContract = {};
  for (const recv of receivables) {
    const adDetail = adDetails.find(d => d.id === recv.type_detail_id);
    if (!adDetail) continue;

    const contractId = adDetail.contract_id;
    if (!receivablesByContract[contractId]) {
      receivablesByContract[contractId] = [];
    }
    receivablesByContract[contractId].push(recv);
  }

  // 为每个合同生成缴费
  for (const [contractId, contractReceivables] of Object.entries(receivablesByContract)) {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) continue;

    // 按月份排序
    const sortedReceivables = contractReceivables.sort((a, b) => a.period.localeCompare(b.period));

    // 随机决定已缴费的账单数量（75%缴费率）
    const paidCount = Math.floor(sortedReceivables.length * payment_ratio);

    // 选择前N个月作为已缴费（模拟从前往后缴费）
    const paidReceivables = sortedReceivables.slice(0, paidCount);

    if (paidReceivables.length === 0) continue;

    // 生成缴费记录（可能一次缴多个月，或分多次缴）
    const paymentMethods = ['wechat', 'alipay', 'bank_transfer'];

    // 70%一次性缴清，30%分批缴
    const payAtOnce = Math.random() < 0.7;

    if (payAtOnce && paidReceivables.length > 0) {
      // 一次性缴清
      const totalAmount = paidReceivables.reduce((sum, r) => sum + Number(r.amount), 0);
      const paymentDate = new Date(paidReceivables[0].due_date);
      paymentDate.setDate(paymentDate.getDate() - Math.floor(Math.random() * 5)); // 提前0-5天缴费

      const payment = {
        id: crypto.randomUUID(),
        community_id: communityId,
        type_code: 'ad_revenue',
        owner_id: null,
        amount: totalAmount,
        payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        payment_date: paymentDate.toISOString().split('T')[0],
        paid_at: paymentDate.toISOString(),
        transaction_no: `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        proof_files: [],
        notes: `${contract.advertiser_company} - ${paidReceivables[0].period}至${paidReceivables[paidReceivables.length - 1].period}租金`
      };
      payments.push(payment);

      // 更新所有应收账单状态
      for (const recv of paidReceivables) {
        recv.status = 'paid';
        recv.payment_id = payment.id;
      }
    } else {
      // 分批缴费（每次缴1-3个月）
      let remaining = [...paidReceivables];
      while (remaining.length > 0) {
        const batchSize = Math.min(Math.floor(Math.random() * 3) + 1, remaining.length);
        const batch = remaining.slice(0, batchSize);
        remaining = remaining.slice(batchSize);

        const totalAmount = batch.reduce((sum, r) => sum + Number(r.amount), 0);
        const paymentDate = new Date(batch[0].due_date);
        paymentDate.setDate(paymentDate.getDate() - Math.floor(Math.random() * 5));

        const payment = {
          id: crypto.randomUUID(),
          community_id: communityId,
          type_code: 'ad_revenue',
          owner_id: null,
          amount: totalAmount,
          payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          payment_date: paymentDate.toISOString().split('T')[0],
          paid_at: paymentDate.toISOString(),
          transaction_no: `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          proof_files: [],
          notes: `${contract.advertiser_company} - ${batch[0].period}${batch.length > 1 ? '至' + batch[batch.length - 1].period : ''}租金`
        };
        payments.push(payment);

        // 更新应收账单状态
        for (const recv of batch) {
          recv.status = 'paid';
          recv.payment_id = payment.id;
        }
      }
    }
  }

  console.log(`✅ 生成 ${payments.length} 条缴费记录`);
  console.log(`   总收益: ¥${payments.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}`);
  console.log(`   已缴账单: ${receivables.filter(r => r.status === 'paid').length}/${receivables.length}`);

  return { adDetails, receivables, payments };
}

// 生成统计信息
function generateStatistics(spots, contracts, receivables, payments) {
  console.log('\n📊 数据统计信息:');
  console.log('=====================================');

  // 广告位统计
  const elevatorSpots = spots.filter(s => s.spot_type === 'elevator').length;
  const gateSpots = spots.filter(s => s.spot_type === 'gate').length;
  const occupiedSpots = spots.filter(s => s.status === 'occupied').length;

  console.log(`\n📢 广告位:`);
  console.log(`   总广告位: ${spots.length}个`);
  console.log(`   - 电梯广告: ${elevatorSpots}个`);
  console.log(`   - 闸机广告: ${gateSpots}个`);
  console.log(`   已出租: ${occupiedSpots}个 (${(occupiedSpots / spots.length * 100).toFixed(1)}%)`);
  console.log(`   空置: ${spots.length - occupiedSpots}个`);

  // 合同统计
  const activeContracts = contracts.filter(c => c.status === 'active').length;
  const contractsWithDeposit = contracts.filter(c => c.deposit > 0).length;
  const totalDeposit = contracts.reduce((sum, c) => sum + Number(c.deposit), 0);

  console.log(`\n📝 广告合同:`);
  console.log(`   总合同数: ${contracts.length}个`);
  console.log(`   有效合同: ${activeContracts}个`);
  console.log(`   有押金合同: ${contractsWithDeposit}个`);
  console.log(`   押金总额: ¥${totalDeposit.toLocaleString()}`);

  // 收益统计
  const totalReceivable = receivables.reduce((sum, r) => sum + Number(r.amount), 0);
  const paidReceivables = receivables.filter(r => r.status === 'paid');
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const unpaidAmount = totalReceivable - totalPaid;

  console.log(`\n💰 收益统计:`);
  console.log(`   应收总额: ¥${totalReceivable.toLocaleString()}`);
  console.log(`   实收总额: ¥${totalPaid.toLocaleString()}`);
  console.log(`   未缴金额: ¥${unpaidAmount.toLocaleString()}`);
  console.log(`   已缴账单: ${paidReceivables.length}/${receivables.length} (${(paidReceivables.length / receivables.length * 100).toFixed(1)}%)`);
  console.log(`   缴费记录: ${payments.length}条`);

  // 支付方式统计
  const paymentByMethod = {};
  for (const payment of payments) {
    const method = payment.payment_method;
    paymentByMethod[method] = (paymentByMethod[method] || 0) + Number(payment.amount);
  }

  console.log(`\n💳 支付方式:`);
  for (const [method, amount] of Object.entries(paymentByMethod)) {
    const methodName = { wechat: '微信', alipay: '支付宝', bank_transfer: '银行转账' }[method] || method;
    console.log(`   ${methodName}: ¥${amount.toLocaleString()}`);
  }

  console.log('\n=====================================');
}

// 主函数
async function main() {
  console.log('🚀 开始生成广告收益测试数据...\n');

  try {
    // 1. 获取基础数据
    const communityId = await getCommunityId();

    // 2. 生成广告位
    const spots = generateAdSpots(communityId);

    // 3. 生成广告合同
    const contracts = generateAdContracts(spots, communityId);

    // 4. 生成账单和缴费数据
    const { adDetails, receivables, payments } = generateBillingData(contracts, communityId);

    // 5. 生成统计信息
    generateStatistics(spots, contracts, receivables, payments);

    // 6. 保存到文件
    const data = {
      ad_spots: spots,
      ad_contracts: contracts,
      ad_details: adDetails,
      receivables: receivables,
      payments: payments,
      metadata: {
        generated_at: new Date().toISOString(),
        environment: env,
        directus_url: directus.url,
        config: CONFIG
      }
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
    console.log(`\n✅ 数据已保存到: ${OUTPUT_FILE}`);
    console.log(`📦 文件大小: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB`);

    console.log('\n🎉 广告收益测试数据生成完成！');
    console.log('\n下一步：运行导入脚本将数据导入Directus');
    console.log(`   node import-ad-data.js ${env}`);

  } catch (error) {
    console.error('\n❌ 生成数据失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行
main();
