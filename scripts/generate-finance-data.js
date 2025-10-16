#!/usr/bin/env node

/**
 * 兰亭雅苑财务数据生成脚本
 * 
 * 使用方法:
 * DIRECTUS_TOKEN="your_token" node scripts/generate-finance-data.js
 * 
 * 或者:
 * node scripts/generate-finance-data.js --token="your_token"
 */

const https = require('https');
const http = require('http');

// ============================================================
// 配置
// ============================================================

const CONFIG = {
  DIRECTUS_URL: 'http://localhost:8055',
  DIRECTUS_TOKEN: process.env.DIRECTUS_TOKEN || process.argv.find(arg => arg.startsWith('--token='))?.split('=')[1],
  COMMUNITY_ID: '2a5c769e-9909-4331-99b3-983c8b1175c6',
  COMMUNITY_NAME: '兰亭雅苑',
  
  // 时间范围：2024年7月-12月（6个月）
  START_MONTH: '2024-07',
  END_MONTH: '2024-12',
  
  // 物业费配置
  UNIT_PRICE: 4.0, // 元/㎡
  PAYMENT_RATE: 0.85, // 85%缴费率
  
  // 员工配置
  EMPLOYEES: [
    { name: '张三', position_type: 'security', position_title: '保安队长', base_salary: 5500 },
    { name: '李四', position_type: 'security', position_title: '保安队员', base_salary: 4500 },
    { name: '王五', position_type: 'cleaning', position_title: '保洁', base_salary: 4000 },
    { name: '赵六', position_type: 'cleaning', position_title: '保洁', base_salary: 4000 },
    { name: '孙七', position_type: 'management', position_title: '物业经理', base_salary: 5000 },
  ],
  
  // 维修基金配置
  MF_UNIT_PRICE: 100, // 元/㎡
};

// 检查 token
if (!CONFIG.DIRECTUS_TOKEN) {
  console.error('❌ 错误: 请设置 DIRECTUS_TOKEN');
  console.error('   使用方法: DIRECTUS_TOKEN="your_token" node scripts/generate-finance-data.js');
  process.exit(1);
}

// ============================================================
// 工具函数
// ============================================================

/**
 * HTTP 请求封装
 */
function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, CONFIG.DIRECTUS_URL);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${CONFIG.DIRECTUS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };
    
    const req = lib.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${json.errors?.[0]?.message || body}`));
          }
        } catch (e) {
          reject(new Error(`解析响应失败: ${body}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * 生成月份列表
 */
function generateMonths(start, end) {
  const months = [];
  const [startYear, startMonth] = start.split('-').map(Number);
  const [endYear, endMonth] = end.split('-').map(Number);
  
  for (let year = startYear; year <= endYear; year++) {
    const monthStart = year === startYear ? startMonth : 1;
    const monthEnd = year === endYear ? endMonth : 12;
    
    for (let month = monthStart; month <= monthEnd; month++) {
      months.push(`${year}-${String(month).padStart(2, '0')}`);
    }
  }
  
  return months;
}

/**
 * 生成随机数
 */
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成随机日期
 */
function randomDate(year, month, dayStart = 1, dayEnd = 28) {
  const day = random(dayStart, dayEnd);
  const hour = random(8, 18);
  const minute = random(0, 59);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

/**
 * 随机选择
 */
function randomChoice(array) {
  return array[random(0, array.length - 1)];
}

/**
 * 延迟函数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// 数据生成函数
// ============================================================

/**
 * 1. 获取业主列表
 */
async function fetchResidents() {
  console.log('📋 获取业主列表...');
  
  const response = await request('GET', `/users?filter[community_id][_eq]=${CONFIG.COMMUNITY_ID}&filter[user_type][_eq]=resident&fields=id,first_name,last_name,email,building_id&limit=100`);
  
  const residents = response.data || [];
  console.log(`   ✅ 找到 ${residents.length} 位业主`);
  
  return residents;
}

/**
 * 2. 创建员工
 */
async function createEmployees() {
  console.log('\n👷 创建员工...');
  
  const employees = [];
  
  for (const emp of CONFIG.EMPLOYEES) {
    try {
      const data = {
        community_id: CONFIG.COMMUNITY_ID,
        name: emp.name,
        phone: `138${String(random(10000000, 99999999))}`,
        id_card_last4: String(random(1000, 9999)),
        position_type: emp.position_type,
        position_title: emp.position_title,
        employment_status: 'active',
        hire_date: '2024-01-01',
        base_salary: emp.base_salary,
      };
      
      const response = await request('POST', '/items/employees', data);
      employees.push(response.data);
      console.log(`   ✅ 创建员工: ${emp.name} (${emp.position_title})`);
      
      await sleep(100); // 避免请求过快
    } catch (error) {
      console.error(`   ❌ 创建员工失败 (${emp.name}): ${error.message}`);
    }
  }
  
  return employees;
}

/**
 * 3. 创建物业费账单
 */
async function createBillings(residents, months) {
  console.log('\n💰 创建物业费账单...');
  
  const billings = [];
  let successCount = 0;
  let failCount = 0;
  
  for (const month of months) {
    const [year, monthNum] = month.split('-').map(Number);
    
    for (const resident of residents) {
      try {
        // 随机房屋面积 60-120㎡
        const area = random(60, 120);
        const billing_amount = area * CONFIG.UNIT_PRICE;
        
        // 85%的账单会被缴纳
        const willPay = Math.random() < CONFIG.PAYMENT_RATE;
        const status = willPay ? 'paid' : 'unpaid';
        const paid_amount = willPay ? billing_amount : 0;
        
        const data = {
          community_id: CONFIG.COMMUNITY_ID,
          building_id: resident.building_id,
          owner_id: resident.id,
          period: month,
          billing_amount,
          area,
          unit_price: CONFIG.UNIT_PRICE,
          status,
          paid_amount,
          due_date: `${year}-${String(monthNum).padStart(2, '0')}-28T23:59:59`,
          late_fee: 0,
        };
        
        const response = await request('POST', '/items/billings', data);
        billings.push(response.data);
        successCount++;
        
        await sleep(50);
      } catch (error) {
        failCount++;
        if (failCount <= 3) {
          console.error(`   ❌ 创建账单失败: ${error.message}`);
        }
      }
    }
    
    console.log(`   ✅ ${month}: 创建 ${residents.length} 条账单`);
  }
  
  console.log(`   📊 总计: 成功 ${successCount} 条, 失败 ${failCount} 条`);
  return billings;
}

/**
 * 4. 创建物业费收款记录
 */
async function createBillingPayments(billings) {
  console.log('\n💵 创建物业费收款记录...');
  
  const payments = [];
  const paidBillings = billings.filter(b => b.status === 'paid');
  let successCount = 0;
  
  const paymentMethods = ['wechat', 'alipay', 'bank', 'cash'];
  const methodWeights = [0.4, 0.3, 0.25, 0.05]; // 权重
  
  for (const billing of paidBillings) {
    try {
      const [year, month] = billing.period.split('-').map(Number);
      
      // 随机选择支付方式（按权重）
      const rand = Math.random();
      let cumWeight = 0;
      let paymentMethod = 'wechat';
      for (let i = 0; i < methodWeights.length; i++) {
        cumWeight += methodWeights[i];
        if (rand < cumWeight) {
          paymentMethod = paymentMethods[i];
          break;
        }
      }
      
      const data = {
        billing_id: billing.id,
        community_id: CONFIG.COMMUNITY_ID,
        owner_id: billing.owner_id,
        amount: billing.paid_amount,
        paid_at: randomDate(year, month, 5, 25),
        payment_method: paymentMethod,
        payer_name: '业主本人',
        transaction_no: `${paymentMethod.toUpperCase()}${year}${String(month).padStart(2, '0')}${String(random(100000, 999999))}`,
      };
      
      const response = await request('POST', '/items/billing_payments', data);
      payments.push(response.data);
      successCount++;
      
      await sleep(50);
    } catch (error) {
      if (successCount === 0) {
        console.error(`   ❌ 创建收款记录失败: ${error.message}`);
      }
    }
  }
  
  console.log(`   ✅ 创建 ${successCount} 条收款记录`);
  return payments;
}

/**
 * 5. 创建公共收益
 */
async function createIncomes(months) {
  console.log('\n💰 创建公共收益...');
  
  const incomes = [];
  let successCount = 0;
  
  const incomeTypes = [
    { type: 'parking', title: '临时停车收益', amount: [4000, 6000] },
    { type: 'parking', title: '月租车位收益', amount: [3000, 5000] },
    { type: 'advertising', title: '电梯广告收益', amount: [1500, 2500] },
    { type: 'advertising', title: '门禁广告收益', amount: [800, 1200] },
    { type: 'venue_rental', title: '会议室租赁', amount: [500, 1500] },
    { type: 'express_locker', title: '快递柜分成', amount: [800, 1200] },
  ];
  
  for (const month of months) {
    const [year, monthNum] = month.split('-').map(Number);
    
    // 每月随机选择 5-6 项收益
    const selectedIncomes = [];
    const shuffled = [...incomeTypes].sort(() => Math.random() - 0.5);
    const count = random(5, 6);
    
    for (let i = 0; i < count && i < shuffled.length; i++) {
      const income = shuffled[i];
      const amount = random(income.amount[0], income.amount[1]);
      
      try {
        const data = {
          community_id: CONFIG.COMMUNITY_ID,
          income_type: income.type,
          title: `${month} ${income.title}`,
          description: `${CONFIG.COMMUNITY_NAME}${month}月${income.title}`,
          amount,
          income_date: randomDate(year, monthNum, 1, 28),
          period: month,
          payment_method: 'bank',
          transaction_no: `INCOME${year}${String(monthNum).padStart(2, '0')}${String(random(1000, 9999))}`,
        };
        
        const response = await request('POST', '/items/incomes', data);
        incomes.push(response.data);
        successCount++;
        
        await sleep(50);
      } catch (error) {
        if (successCount === 0) {
          console.error(`   ❌ 创建收益失败: ${error.message}`);
        }
      }
    }
    
    console.log(`   ✅ ${month}: 创建 ${count} 条收益记录`);
  }
  
  console.log(`   📊 总计: ${successCount} 条收益记录`);
  return incomes;
}

/**
 * 6. 创建工资记录和支出
 */
async function createSalariesAndExpenses(employees, months, adminUserId) {
  console.log('\n💸 创建工资记录和支出...');
  
  const salaries = [];
  const expenses = [];
  let successCount = 0;
  
  for (const month of months) {
    const [year, monthNum] = month.split('-').map(Number);
    
    // 先创建工资支出记录
    const totalSalary = employees.reduce((sum, emp) => sum + emp.base_salary, 0);
    
    try {
      const expenseData = {
        community_id: CONFIG.COMMUNITY_ID,
        expense_type: 'salary',
        title: `${month}月员工工资`,
        description: `${CONFIG.COMMUNITY_NAME}${month}月员工工资发放`,
        amount: totalSalary,
        paid_at: `${year}-${String(monthNum).padStart(2, '0')}-15T10:00:00`,
        period: month,
        payment_method: 'bank',
        status: 'approved',
        created_by: adminUserId,
      };
      
      const expenseResponse = await request('POST', '/items/expenses', expenseData);
      const expenseId = expenseResponse.data.id;
      expenses.push(expenseResponse.data);
      
      await sleep(100);
      
      // 为每个员工创建工资记录
      for (const employee of employees) {
        try {
          const bonus = random(0, 500);
          const subsidy = random(0, 200);
          const social_security = Math.round(employee.base_salary * 0.1);
          const housing_fund = Math.round(employee.base_salary * 0.08);
          const actual_amount = employee.base_salary + bonus + subsidy - social_security - housing_fund;
          
          const salaryData = {
            employee_id: employee.id,
            community_id: CONFIG.COMMUNITY_ID,
            period: month,
            base_salary: employee.base_salary,
            bonus,
            subsidy,
            deduction: 0,
            social_security,
            housing_fund,
            actual_amount,
            payment_date: `${year}-${String(monthNum).padStart(2, '0')}-15T10:00:00`,
            payment_method: 'bank',
            expense_id: expenseId,
          };
          
          const salaryResponse = await request('POST', '/items/salary_records', salaryData);
          salaries.push(salaryResponse.data);
          successCount++;
          
          await sleep(50);
        } catch (error) {
          // 忽略单个工资记录失败
        }
      }
      
      console.log(`   ✅ ${month}: 创建工资记录和支出`);
    } catch (error) {
      console.error(`   ❌ ${month}: 创建失败 - ${error.message}`);
    }
  }
  
  console.log(`   📊 总计: ${successCount} 条工资记录, ${expenses.length} 条支出`);
  return { salaries, expenses };
}

/**
 * 7. 创建其他支出
 */
async function createOtherExpenses(months, adminUserId) {
  console.log('\n💸 创建其他支出记录...');
  
  const expenses = [];
  let successCount = 0;
  
  const expenseTypes = [
    { type: 'utilities', title: '电费', amount: [5000, 8000] },
    { type: 'utilities', title: '水费', amount: [2000, 3000] },
    { type: 'maintenance', title: '电梯维护', amount: [2000, 4000] },
    { type: 'maintenance', title: '绿化养护', amount: [1500, 2500] },
    { type: 'materials', title: '清洁用品采购', amount: [1000, 2000] },
    { type: 'materials', title: '办公用品采购', amount: [500, 1000] },
  ];
  
  for (const month of months) {
    const [year, monthNum] = month.split('-').map(Number);
    
    // 每月随机选择 4-6 项支出
    const count = random(4, 6);
    const shuffled = [...expenseTypes].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < count && i < shuffled.length; i++) {
      const expense = shuffled[i];
      const amount = random(expense.amount[0], expense.amount[1]);
      
      try {
        const data = {
          community_id: CONFIG.COMMUNITY_ID,
          expense_type: expense.type,
          title: `${month} ${expense.title}`,
          description: `${CONFIG.COMMUNITY_NAME}${month}月${expense.title}`,
          amount,
          paid_at: randomDate(year, monthNum, 20, 28),
          period: month,
          payment_method: 'bank',
          status: 'approved',
          created_by: adminUserId,
        };
        
        const response = await request('POST', '/items/expenses', data);
        expenses.push(response.data);
        successCount++;
        
        await sleep(50);
      } catch (error) {
        // 忽略失败
      }
    }
    
    console.log(`   ✅ ${month}: 创建 ${count} 条支出记录`);
  }
  
  console.log(`   📊 总计: ${successCount} 条支出记录`);
  return expenses;
}

/**
 * 8. 创建维修基金账户
 */
async function createMaintenanceFundAccounts(residents) {
  console.log('\n🏦 创建维修基金账户...');
  
  const accounts = [];
  let successCount = 0;
  
  for (const resident of residents) {
    try {
      const house_area = random(60, 120);
      const total_paid = house_area * CONFIG.MF_UNIT_PRICE;
      
      const data = {
        community_id: CONFIG.COMMUNITY_ID,
        building_id: resident.building_id,
        owner_id: resident.id,
        house_area,
        unit_number: `${random(1, 6)}-${random(101, 606)}`,
        total_paid,
        total_used: 0,
        balance: total_paid,
        last_payment_date: '2024-07-10T00:00:00',
      };
      
      const response = await request('POST', '/items/maintenance_fund_accounts', data);
      accounts.push(response.data);
      successCount++;
      
      await sleep(50);
    } catch (error) {
      if (successCount === 0) {
        console.error(`   ❌ 创建账户失败: ${error.message}`);
      }
    }
  }
  
  console.log(`   ✅ 创建 ${successCount} 个维修基金账户`);
  return accounts;
}

/**
 * 9. 创建维修基金缴纳记录
 */
async function createMaintenanceFundPayments(accounts) {
  console.log('\n💰 创建维修基金缴纳记录...');
  
  const payments = [];
  let successCount = 0;
  
  for (const account of accounts) {
    try {
      const data = {
        account_id: account.id,
        community_id: CONFIG.COMMUNITY_ID,
        owner_id: account.owner_id,
        payment_type: 'initial',
        amount: account.total_paid,
        paid_at: '2024-07-10T10:00:00',
        payment_method: 'bank',
        house_area: account.house_area,
        unit_price: CONFIG.MF_UNIT_PRICE,
      };
      
      const response = await request('POST', '/items/maintenance_fund_payments', data);
      payments.push(response.data);
      successCount++;
      
      await sleep(50);
    } catch (error) {
      if (successCount === 0) {
        console.error(`   ❌ 创建缴纳记录失败: ${error.message}`);
      }
    }
  }
  
  console.log(`   ✅ 创建 ${successCount} 条缴纳记录`);
  return payments;
}

// ============================================================
// 主函数
// ============================================================

async function main() {
  console.log('🚀 开始生成兰亭雅苑财务数据...');
  console.log('================================================');
  console.log(`社区: ${CONFIG.COMMUNITY_NAME}`);
  console.log(`时间范围: ${CONFIG.START_MONTH} 至 ${CONFIG.END_MONTH}`);
  console.log('================================================\n');
  
  try {
    // 生成月份列表
    const months = generateMonths(CONFIG.START_MONTH, CONFIG.END_MONTH);
    console.log(`📅 生成 ${months.length} 个月的数据: ${months.join(', ')}\n`);
    
    // 获取管理员用户ID（用于创建支出记录）
    const adminUserId = '4241c424-0bd4-4f85-90b6-31cb57d31b8e';
    
    // 1. 获取业主列表
    const residents = await fetchResidents();
    if (residents.length === 0) {
      throw new Error('未找到业主数据');
    }
    
    // 2. 创建员工
    const employees = await createEmployees();
    
    // 3. 创建物业费账单
    const billings = await createBillings(residents, months);
    
    // 4. 创建物业费收款记录
    const billingPayments = await createBillingPayments(billings);
    
    // 5. 创建公共收益
    const incomes = await createIncomes(months);
    
    // 6. 创建工资记录和支出
    const { salaries, expenses: salaryExpenses } = await createSalariesAndExpenses(employees, months, adminUserId);
    
    // 7. 创建其他支出
    const otherExpenses = await createOtherExpenses(months, adminUserId);
    
    // 8. 创建维修基金账户
    const mfAccounts = await createMaintenanceFundAccounts(residents);
    
    // 9. 创建维修基金缴纳记录
    const mfPayments = await createMaintenanceFundPayments(mfAccounts);
    
    // 统计
    console.log('\n================================================');
    console.log('✅ 数据生成完成！');
    console.log('================================================');
    console.log('\n📊 数据统计:');
    console.log(`   - 业主: ${residents.length} 户`);
    console.log(`   - 员工: ${employees.length} 人`);
    console.log(`   - 物业费账单: ${billings.length} 条`);
    console.log(`   - 物业费收款: ${billingPayments.length} 条`);
    console.log(`   - 公共收益: ${incomes.length} 条`);
    console.log(`   - 工资记录: ${salaries.length} 条`);
    console.log(`   - 支出记录: ${salaryExpenses.length + otherExpenses.length} 条`);
    console.log(`   - 维修基金账户: ${mfAccounts.length} 个`);
    console.log(`   - 维修基金缴纳: ${mfPayments.length} 条`);
    console.log(`   - 总计: ${billings.length + billingPayments.length + incomes.length + salaries.length + salaryExpenses.length + otherExpenses.length + mfAccounts.length + mfPayments.length + employees.length} 条记录`);
    
    console.log('\n📋 下一步操作:');
    console.log('   1. 在 Directus Admin 中验证数据');
    console.log('   2. 配置权限: bash scripts/fix-resident-billing-permissions.sh');
    console.log('   3. 在应用中测试功能');
    
  } catch (error) {
    console.error('\n❌ 生成失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行
main();
