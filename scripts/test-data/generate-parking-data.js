#!/usr/bin/env node

/**
 * 停车费测试数据生成器
 *
 * 用法：
 *   node generate-parking-data.js [local|remote]
 *
 * 功能：
 *   1. 生成100个停车位数据
 *   2. 为已售车位生成管理费账单和缴费记录
 *   3. 为已租车位生成租金账单和缴费记录
 *   4. 生成临时停车记录
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 配置
const OUTPUT_FILE = path.join(__dirname, 'parking-data-generated.json');

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
  // 车位配置
  total_spots: 100,
  fixed_spots: 60,      // 固定车位（可售）
  public_spots: 40,     // 公共车位

  // 固定车位分配
  sold_ratio: 0.67,     // 40/60 = 66.7% 已售

  // 公共车位分配
  rented_ratio: 0.5,    // 20/40 = 50% 已租

  // 费用标准
  management_fee: 200,  // 月管理费 200元
  monthly_rent: 500,    // 月租金 500元
  temp_parking_rate: 5, // 临停 5元/小时

  // 账单生成（2025年1-10月）
  year: 2025,
  months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],

  // 缴费情况
  payment_ratio: 0.7,   // 70%已缴费

  // 临停记录（最近7天）
  temp_records_per_day: 15
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

// 获取业主列表
async function getOwners() {
  console.log('👥 获取业主列表...');

  try {
    const rolesResult = await fetchDirectus('/roles?filter[name][_eq]=resident&fields=id,name');

    let residentRoleId = null;
    if (rolesResult.data && rolesResult.data.length > 0) {
      residentRoleId = rolesResult.data[0].id;
      console.log(`   找到resident角色: ${residentRoleId}`);
    }

    let result;
    if (residentRoleId) {
      result = await fetchDirectus(`/users?filter[role][_eq]=${residentRoleId}&limit=-1&fields=id,first_name,email`);
    } else {
      console.warn('⚠️  未找到resident角色，将获取所有非管理员用户');
      const adminRoleResult = await fetchDirectus('/roles?filter[name][_eq]=Administrator&fields=id');
      const adminRoleId = adminRoleResult.data?.[0]?.id;

      if (adminRoleId) {
        result = await fetchDirectus(`/users?filter[role][_neq]=${adminRoleId}&limit=-1&fields=id,first_name,email`);
      } else {
        result = await fetchDirectus('/users?limit=50&fields=id,first_name,email');
      }
    }

    if (!result.data || result.data.length === 0) {
      console.warn('⚠️  未找到任何用户');
      return [];
    }

    console.log(`✅ 找到 ${result.data.length} 个业主用户`);
    if (result.data.length > 0) {
      console.log(`   示例: ${result.data.slice(0, 3).map(u => u.first_name || u.email).join(', ')}...`);
    }

    return result.data;
  } catch (error) {
    console.error(`❌ 获取业主列表失败: ${error.message}`);
    throw error;
  }
}

// 生成车牌号
function generateLicensePlate() {
  const provinces = ['京', '沪', '粤', '浙', '苏', '鲁', '川'];
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const province = provinces[Math.floor(Math.random() * provinces.length)];
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const numbers = Math.random().toString().substring(2, 7);
  return `${province}${letter}${numbers}`;
}

// 生成停车位
function generateParkingSpots(owners, communityId) {
  console.log('🅿️  生成停车位数据...');

  const spots = [];
  const { total_spots, fixed_spots, sold_ratio, rented_ratio, management_fee, monthly_rent } = CONFIG;

  // 计算数量
  const soldCount = Math.floor(fixed_spots * sold_ratio);
  const rentedCount = Math.floor((total_spots - fixed_spots) * rented_ratio);

  console.log(`   - 固定车位: ${fixed_spots} 个（${soldCount}个已售）`);
  console.log(`   - 公共车位: ${total_spots - fixed_spots} 个（${rentedCount}个已租）`);

  let ownerIndex = 0;

  // 生成固定车位（A区）
  for (let i = 1; i <= fixed_spots; i++) {
    const spotNumber = `A-${String(i).padStart(3, '0')}`;
    const floor = Math.floor((i - 1) / 20) + 1; // 每层20个
    const isSold = i <= soldCount;

    const spot = {
      id: crypto.randomUUID(),
      community_id: communityId,
      spot_number: spotNumber,
      location: `地下${floor}层A区`,
      type: 'fixed',
      ownership: isSold ? 'owned' : 'public',
      is_sold: isSold,
      is_rented: false,
      status: 'active'
    };

    if (isSold && ownerIndex < owners.length) {
      const owner = owners[ownerIndex % owners.length];
      spot.owner_id = owner.id;
      spot.license_plate = generateLicensePlate();
      spot.monthly_management_fee = management_fee;
      ownerIndex++;
    }

    spots.push(spot);
  }

  // 生成公共车位（B区）
  for (let i = 1; i <= total_spots - fixed_spots; i++) {
    const spotNumber = `B-${String(i).padStart(3, '0')}`;
    const floor = Math.floor((i - 1) / 20) + 1;
    const isRented = i <= rentedCount;

    const spot = {
      id: crypto.randomUUID(),
      community_id: communityId,
      spot_number: spotNumber,
      location: `地下${floor}层B区`,
      type: 'fixed',
      ownership: 'public',
      is_sold: false,
      is_rented: isRented,
      status: 'active'
    };

    if (isRented && ownerIndex < owners.length) {
      const renter = owners[ownerIndex % owners.length];
      spot.renter_id = renter.id;
      spot.license_plate = generateLicensePlate();
      spot.monthly_rent = monthly_rent;

      // 租赁合同日期（2025年1月开始，租期半年或一年）
      const contractMonths = Math.random() < 0.5 ? 6 : 12;
      spot.rent_contract_start = '2025-01-01';
      spot.rent_contract_end = contractMonths === 6 ? '2025-06-30' : '2025-12-31';

      ownerIndex++;
    }

    spots.push(spot);
  }

  console.log(`✅ 生成了 ${spots.length} 个停车位`);
  return spots;
}

// 生成应收账单和详情
function generateReceivablesAndDetails(spots, communityId) {
  console.log('📝 生成应收账单...');

  const receivables = [];
  const parkingDetails = [];
  const { year, months, management_fee, monthly_rent } = CONFIG;

  for (const spot of spots) {
    // 已售车位 - 生成管理费账单
    if (spot.is_sold && spot.owner_id) {
      for (const month of months) {
        const period = `${year}-${String(month).padStart(2, '0')}`;
        const dueDate = `${period}-05T23:59:59.000Z`; // 每月5号

        const detailId = crypto.randomUUID();
        const receivableId = crypto.randomUUID();

        parkingDetails.push({
          id: detailId,
          parking_spot_id: spot.id,
          fee_type: 'management'
        });

        receivables.push({
          id: receivableId,
          community_id: communityId,
          type_code: 'parking_management',
          type_detail_id: detailId,
          owner_id: spot.owner_id,
          period,
          amount: management_fee,
          due_date: dueDate,
          status: 'unpaid',
          late_fee: 0
        });
      }
    }

    // 已租车位 - 生成租金账单
    if (spot.is_rented && spot.renter_id) {
      const contractEnd = new Date(spot.rent_contract_end);
      const endMonth = contractEnd.getMonth() + 1;
      const actualMonths = months.filter(m => m <= endMonth);

      for (const month of actualMonths) {
        const period = `${year}-${String(month).padStart(2, '0')}`;
        const dueDate = `${period}-05T23:59:59.000Z`;

        const detailId = crypto.randomUUID();
        const receivableId = crypto.randomUUID();

        parkingDetails.push({
          id: detailId,
          parking_spot_id: spot.id,
          fee_type: 'rent',
          contract_no: `RENT-2025-${String(spots.indexOf(spot)).padStart(3, '0')}`
        });

        receivables.push({
          id: receivableId,
          community_id: communityId,
          type_code: 'parking_rent',
          type_detail_id: detailId,
          owner_id: spot.renter_id,
          period,
          amount: monthly_rent,
          due_date: dueDate,
          status: 'unpaid',
          late_fee: 0
        });
      }
    }
  }

  console.log(`✅ 生成了 ${receivables.length} 条应收账单`);
  console.log(`✅ 生成了 ${parkingDetails.length} 条详情记录`);

  return { receivables, parkingDetails };
}

// 生成缴费记录
function generatePayments(receivables, parkingDetails, communityId) {
  console.log('💰 生成缴费记录...');

  const payments = [];
  const { payment_ratio } = CONFIG;

  // 按owner_id分组
  const receivablesByOwner = {};
  for (const recv of receivables) {
    if (!receivablesByOwner[recv.owner_id]) {
      receivablesByOwner[recv.owner_id] = [];
    }
    receivablesByOwner[recv.owner_id].push(recv);
  }

  for (const ownerId in receivablesByOwner) {
    const ownerReceivables = receivablesByOwner[ownerId].sort((a, b) => a.period.localeCompare(b.period));
    const totalMonths = ownerReceivables.length;
    const paidMonths = Math.floor(totalMonths * payment_ratio);

    if (paidMonths === 0) continue;

    // 决定缴费方式：70%一次缴清，30%分批缴
    const payInFull = Math.random() < 0.7;

    if (payInFull) {
      // 一次性缴清
      const paidReceivables = ownerReceivables.slice(0, paidMonths);
      const totalAmount = paidReceivables.reduce((sum, r) => sum + r.amount, 0);
      const lastPeriod = paidReceivables[paidReceivables.length - 1].period;
      const paidAt = `${lastPeriod}-15T${String(Math.floor(Math.random() * 8) + 9).padStart(2, '0')}:30:00.000Z`;

      const paymentId = crypto.randomUUID();
      payments.push({
        id: paymentId,
        community_id: communityId,
        type_code: paidReceivables[0].type_code,
        owner_id: ownerId,
        amount: totalAmount,
        paid_at: paidAt,
        paid_periods: paidReceivables.map(r => r.period),
        payment_method: ['wechat', 'alipay', 'bank_transfer'][Math.floor(Math.random() * 3)],
        transaction_no: `TX${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      });

      // 更新应收状态
      for (const recv of paidReceivables) {
        recv.status = 'paid';
        recv.paid_at = paidAt;
        recv.payment_id = paymentId;
      }

      // 更新details的payment_id
      for (const recv of paidReceivables) {
        const detail = parkingDetails.find(d => d.id === recv.type_detail_id);
        if (detail) {
          detail.payment_id = paymentId;
        }
      }
    } else {
      // 分批缴费（2-3批）
      const batchCount = Math.random() < 0.5 ? 2 : 3;
      let currentIndex = 0;

      for (let i = 0; i < batchCount && currentIndex < paidMonths; i++) {
        const monthsInBatch = i === batchCount - 1
          ? paidMonths - currentIndex
          : Math.ceil((paidMonths - currentIndex) / (batchCount - i));

        const batchReceivables = ownerReceivables.slice(currentIndex, currentIndex + monthsInBatch);
        const totalAmount = batchReceivables.reduce((sum, r) => sum + r.amount, 0);
        const lastPeriod = batchReceivables[batchReceivables.length - 1].period;
        const paidAt = `${lastPeriod}-${String(Math.floor(Math.random() * 11) + 15).padStart(2, '0')}T${String(Math.floor(Math.random() * 8) + 9).padStart(2, '0')}:30:00.000Z`;

        const paymentId = crypto.randomUUID();
        payments.push({
          id: paymentId,
          community_id: communityId,
          type_code: batchReceivables[0].type_code,
          owner_id: ownerId,
          amount: totalAmount,
          paid_at: paidAt,
          paid_periods: batchReceivables.map(r => r.period),
          payment_method: ['wechat', 'alipay', 'bank_transfer'][Math.floor(Math.random() * 3)],
          transaction_no: `TX${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`
        });

        // 更新应收状态
        for (const recv of batchReceivables) {
          recv.status = 'paid';
          recv.paid_at = paidAt;
          recv.payment_id = paymentId;
        }

        // 更新details的payment_id
        for (const recv of batchReceivables) {
          const detail = parkingDetails.find(d => d.id === recv.type_detail_id);
          if (detail) {
            detail.payment_id = paymentId;
          }
        }

        currentIndex += monthsInBatch;
      }
    }
  }

  console.log(`✅ 生成了 ${payments.length} 条缴费记录`);
  return payments;
}

// 生成临停记录
function generateTempRecords(spots, communityId) {
  console.log('🚗 生成临停记录...');

  const tempRecords = [];
  const tempPayments = [];
  const { temp_records_per_day, temp_parking_rate } = CONFIG;

  // 找出可用的临停车位（空置的公共车位）
  const tempSpots = spots.filter(s => s.ownership === 'public' && !s.is_rented).slice(0, 10);

  if (tempSpots.length === 0) {
    console.log('⚠️  没有可用的临停车位');
    return { tempRecords, tempPayments };
  }

  // 生成最近7天的临停记录
  const now = new Date();
  for (let day = 6; day >= 0; day--) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    const dateStr = date.toISOString().split('T')[0];

    const recordCount = Math.floor(Math.random() * 6) + temp_records_per_day - 3; // temp_records_per_day ± 3

    for (let i = 0; i < recordCount; i++) {
      const spot = tempSpots[Math.floor(Math.random() * tempSpots.length)];
      const licensePlate = generateLicensePlate();

      // 入场时间：当天8:00-20:00随机
      const entryHour = Math.floor(Math.random() * 12) + 8;
      const entryMinute = Math.floor(Math.random() * 60);
      const entryTime = `${dateStr}T${String(entryHour).padStart(2, '0')}:${String(entryMinute).padStart(2, '0')}:00.000Z`;

      // 停车时长：1-6小时
      const durationMinutes = (Math.floor(Math.random() * 5) + 1) * 60 + Math.floor(Math.random() * 60);
      const exitDate = new Date(entryTime);
      exitDate.setMinutes(exitDate.getMinutes() + durationMinutes);
      const exitTime = exitDate.toISOString();

      // 计算费用：按小时计费，不足1小时按1小时算
      const hours = Math.ceil(durationMinutes / 60);
      const amount = hours * temp_parking_rate;

      const recordId = crypto.randomUUID();
      const paymentId = crypto.randomUUID();

      tempRecords.push({
        id: recordId,
        community_id: communityId,
        payment_id: paymentId,
        license_plate: licensePlate,
        entry_time: entryTime,
        exit_time: exitTime,
        duration_minutes: durationMinutes,
        parking_spot_number: spot.spot_number,
        calculated_amount: amount,
        actual_amount: amount,
        is_paid: true,
        payment_method: Math.random() < 0.7 ? 'wechat' : 'alipay',
        gate_system_id: `GATE-${Math.floor(Math.random() * 3) + 1}-${dateStr.replace(/-/g, '')}-${String(i).padStart(3, '0')}`
      });

      tempPayments.push({
        id: paymentId,
        community_id: communityId,
        type_code: 'parking_temp',
        amount: amount,
        paid_at: exitTime,
        payment_method: Math.random() < 0.7 ? 'wechat' : 'alipay',
        transaction_no: `WX${dateStr.replace(/-/g, '')}${String(entryHour).padStart(2, '0')}${String(entryMinute).padStart(2, '0')}${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      });
    }
  }

  console.log(`✅ 生成了 ${tempRecords.length} 条临停记录`);
  console.log(`✅ 生成了 ${tempPayments.length} 条临停缴费记录`);

  return { tempRecords, tempPayments };
}

// 主函数
async function main() {
  try {
    console.log('🚀 开始生成停车费测试数据...\n');

    // 1. 获取基础信息
    const communityId = await getCommunityId();
    const owners = await getOwners();

    if (owners.length === 0) {
      console.error('❌ 没有找到业主用户，请先创建用户');
      process.exit(1);
    }

    console.log('');

    // 2. 生成停车位
    const spots = generateParkingSpots(owners, communityId);

    // 3. 生成应收账单和详情
    const { receivables, parkingDetails } = generateReceivablesAndDetails(spots, communityId);

    // 4. 生成缴费记录
    const payments = generatePayments(receivables, parkingDetails, communityId);

    // 5. 生成临停记录
    const { tempRecords, tempPayments } = generateTempRecords(spots, communityId);

    // 6. 合并所有缴费记录
    const allPayments = [...payments, ...tempPayments];

    // 7. 统计
    const paidCount = receivables.filter(r => r.status === 'paid').length;
    const unpaidCount = receivables.filter(r => r.status === 'unpaid').length;
    const managementCount = receivables.filter(r => r.type_code === 'parking_management').length;
    const rentCount = receivables.filter(r => r.type_code === 'parking_rent').length;

    console.log('');
    console.log('📊 数据统计:');
    console.log(`   - 停车位总数: ${spots.length}`);
    console.log(`     ∟ 已售车位: ${spots.filter(s => s.is_sold).length} 个`);
    console.log(`     ∟ 已租车位: ${spots.filter(s => s.is_rented).length} 个`);
    console.log(`     ∟ 空置车位: ${spots.filter(s => !s.is_sold && !s.is_rented).length} 个`);
    console.log(`   - 应收账单: ${receivables.length} 条`);
    console.log(`     ∟ 管理费: ${managementCount} 条`);
    console.log(`     ∟ 租金: ${rentCount} 条`);
    console.log(`     ∟ 已缴: ${paidCount} 条 (${(paidCount/receivables.length*100).toFixed(1)}%)`);
    console.log(`     ∟ 欠费: ${unpaidCount} 条 (${(unpaidCount/receivables.length*100).toFixed(1)}%)`);
    console.log(`   - 缴费记录: ${payments.length} 条`);
    console.log(`   - 临停记录: ${tempRecords.length} 条`);
    console.log(`   - 临停缴费: ${tempPayments.length} 条`);

    // 8. 输出到JSON文件
    const output = {
      metadata: {
        generated_at: new Date().toISOString(),
        environment: env,
        directus_url: directus.url,
        config: CONFIG
      },
      statistics: {
        total_spots: spots.length,
        sold_spots: spots.filter(s => s.is_sold).length,
        rented_spots: spots.filter(s => s.is_rented).length,
        vacant_spots: spots.filter(s => !s.is_sold && !s.is_rented).length,
        total_receivables: receivables.length,
        paid_receivables: paidCount,
        unpaid_receivables: unpaidCount,
        total_payments: payments.length,
        temp_records: tempRecords.length,
        temp_payments: tempPayments.length
      },
      data: {
        parking_spots: spots,
        parking_details: parkingDetails,
        receivables,
        payments: allPayments,
        parking_temp_records: tempRecords
      }
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

    console.log('');
    console.log(`✅ 数据已生成并保存到: ${OUTPUT_FILE}`);
    console.log('');
    console.log('📝 下一步：运行导入脚本');
    console.log(`   node import-parking-data.js ${env}`);

  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

main();
