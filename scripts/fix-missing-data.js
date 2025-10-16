#!/usr/bin/env node

/**
 * 修复缺失的财务数据
 * - 物业费收款记录
 * - 工资记录和工资支出
 * - 维修基金缴纳记录
 */

const http = require('http');

const CONFIG = {
  DIRECTUS_URL: 'http://localhost:8055',
  DIRECTUS_TOKEN: process.env.DIRECTUS_TOKEN || 'sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n',
  COMMUNITY_ID: '2a5c769e-9909-4331-99b3-983c8b1175c6',
  ADMIN_USER_ID: '4241c424-0bd4-4f85-90b6-31cb57d31b8e',
};

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, CONFIG.DIRECTUS_URL);
    
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${CONFIG.DIRECTUS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };
    
    const req = http.request(url, options, (res) => {
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(year, month, dayStart = 1, dayEnd = 28) {
  const day = random(dayStart, dayEnd);
  const hour = random(8, 18);
  const minute = random(0, 59);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

/**
 * 1. 创建物业费收款记录
 */
async function createBillingPayments() {
  console.log('\n💵 创建物业费收款记录...');
  
  // 获取所有已缴纳的账单
  const response = await request('GET', `/items/billings?filter[community_id][_eq]=${CONFIG.COMMUNITY_ID}&filter[status][_eq]=paid&fields=id,period,paid_amount,owner_id&limit=1000`);
  const paidBillings = response.data || [];
  
  console.log(`   找到 ${paidBillings.length} 条已缴纳账单`);
  
  const paymentMethods = ['wechat', 'alipay', 'bank', 'cash'];
  const methodWeights = [0.4, 0.3, 0.25, 0.05];
  
  let successCount = 0;
  
  for (const billing of paidBillings) {
    try {
      const [year, month] = billing.period.split('-').map(Number);
      
      // 随机选择支付方式
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
        billing_id: billing.id, // 整数ID
        community_id: CONFIG.COMMUNITY_ID,
        owner_id: billing.owner_id,
        amount: parseFloat(billing.paid_amount),
        paid_at: randomDate(year, month, 5, 25),
        payment_method: paymentMethod,
        payer_name: '业主本人',
        transaction_no: `${paymentMethod.toUpperCase()}${year}${String(month).padStart(2, '0')}${String(random(100000, 999999))}`,
      };
      
      await request('POST', '/items/billing_payments', data);
      successCount++;
      
      if (successCount % 10 === 0) {
        console.log(`   ✅ 已创建 ${successCount} 条...`);
      }
      
      await sleep(50);
    } catch (error) {
      console.error(`   ❌ 创建失败 (billing_id: ${billing.id}): ${error.message}`);
    }
  }
  
  console.log(`   ✅ 总计创建 ${successCount} 条收款记录`);
  return successCount;
}

/**
 * 2. 创建工资记录和工资支出
 */
async function createSalariesAndExpenses() {
  console.log('\n💸 创建工资记录和工资支出...');
  
  // 获取所有员工
  const empResponse = await request('GET', `/items/employees?filter[community_id][_eq]=${CONFIG.COMMUNITY_ID}&fields=id,name,base_salary&limit=100`);
  const employees = empResponse.data || [];
  
  console.log(`   找到 ${employees.length} 名员工`);
  
  const months = ['2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12'];
  let salaryCount = 0;
  let expenseCount = 0;
  
  for (const month of months) {
    const [year, monthNum] = month.split('-').map(Number);
    
    try {
      // 计算总工资（正确求和）
      const totalSalary = employees.reduce((sum, emp) => sum + parseFloat(emp.base_salary), 0);
      
      // 创建工资支出记录
      const expenseData = {
        community_id: CONFIG.COMMUNITY_ID,
        expense_type: 'salary',
        title: `${month}月员工工资`,
        description: `兰亭雅苑${month}月员工工资发放`,
        amount: totalSalary,
        paid_at: `${year}-${String(monthNum).padStart(2, '0')}-15T10:00:00`,
        period: month,
        payment_method: 'bank',
        status: 'approved',
        created_by: CONFIG.ADMIN_USER_ID,
      };
      
      const expenseResponse = await request('POST', '/items/expenses', expenseData);
      const expenseId = expenseResponse.data.id;
      expenseCount++;
      
      await sleep(100);
      
      // 为每个员工创建工资记录
      for (const employee of employees) {
        try {
          const baseSalary = parseFloat(employee.base_salary);
          const bonus = random(0, 500);
          const subsidy = random(0, 200);
          const social_security = Math.round(baseSalary * 0.1);
          const housing_fund = Math.round(baseSalary * 0.08);
          const actual_amount = baseSalary + bonus + subsidy - social_security - housing_fund;
          
          const salaryData = {
            employee_id: employee.id, // 整数ID
            community_id: CONFIG.COMMUNITY_ID,
            period: month,
            base_salary: baseSalary,
            bonus,
            subsidy,
            deduction: 0,
            social_security,
            housing_fund,
            actual_amount,
            payment_date: `${year}-${String(monthNum).padStart(2, '0')}-15T10:00:00`,
            payment_method: 'bank',
            expense_id: expenseId, // 整数ID
          };
          
          await request('POST', '/items/salary_records', salaryData);
          salaryCount++;
          
          await sleep(50);
        } catch (error) {
          console.error(`   ❌ 创建工资记录失败 (${employee.name}, ${month}): ${error.message}`);
        }
      }
      
      console.log(`   ✅ ${month}: 创建工资支出和 ${employees.length} 条工资记录`);
    } catch (error) {
      console.error(`   ❌ ${month}: 创建失败 - ${error.message}`);
    }
  }
  
  console.log(`   ✅ 总计: ${salaryCount} 条工资记录, ${expenseCount} 条工资支出`);
  return { salaryCount, expenseCount };
}

/**
 * 3. 创建维修基金缴纳记录
 */
async function createMaintenanceFundPayments() {
  console.log('\n💰 创建维修基金缴纳记录...');
  
  // 获取所有维修基金账户
  const response = await request('GET', `/items/maintenance_fund_accounts?filter[community_id][_eq]=${CONFIG.COMMUNITY_ID}&fields=id,owner_id,total_paid,house_area&limit=100`);
  const accounts = response.data || [];
  
  console.log(`   找到 ${accounts.length} 个维修基金账户`);
  
  let successCount = 0;
  
  for (const account of accounts) {
    try {
      const data = {
        account_id: account.id, // 整数ID
        community_id: CONFIG.COMMUNITY_ID,
        owner_id: account.owner_id,
        payment_type: 'initial',
        amount: parseFloat(account.total_paid),
        paid_at: '2024-07-10T10:00:00',
        payment_method: 'bank',
        house_area: parseFloat(account.house_area),
        unit_price: 100,
      };
      
      await request('POST', '/items/maintenance_fund_payments', data);
      successCount++;
      
      if (successCount % 5 === 0) {
        console.log(`   ✅ 已创建 ${successCount} 条...`);
      }
      
      await sleep(50);
    } catch (error) {
      console.error(`   ❌ 创建失败 (account_id: ${account.id}): ${error.message}`);
    }
  }
  
  console.log(`   ✅ 总计创建 ${successCount} 条缴纳记录`);
  return successCount;
}

async function main() {
  console.log('🔧 开始修复缺失的财务数据...');
  console.log('================================================\n');
  
  try {
    // 1. 创建物业费收款记录
    const paymentCount = await createBillingPayments();
    
    // 2. 创建工资记录和工资支出
    const { salaryCount, expenseCount } = await createSalariesAndExpenses();
    
    // 3. 创建维修基金缴纳记录
    const mfPaymentCount = await createMaintenanceFundPayments();
    
    // 统计
    console.log('\n================================================');
    console.log('✅ 数据修复完成！');
    console.log('================================================');
    console.log('\n📊 新增数据统计:');
    console.log(`   - 物业费收款记录: ${paymentCount} 条`);
    console.log(`   - 工资记录: ${salaryCount} 条`);
    console.log(`   - 工资支出: ${expenseCount} 条`);
    console.log(`   - 维修基金缴纳记录: ${mfPaymentCount} 条`);
    console.log(`   - 总计: ${paymentCount + salaryCount + expenseCount + mfPaymentCount} 条记录`);
    
    console.log('\n📋 完整数据统计（包含之前创建的）:');
    console.log('   - 员工: 5 人');
    console.log('   - 物业费账单: 72 条');
    console.log(`   - 物业费收款: ${paymentCount} 条`);
    console.log('   - 公共收益: 32 条');
    console.log(`   - 支出记录: ${32 + expenseCount} 条`);
    console.log(`   - 工资记录: ${salaryCount} 条`);
    console.log('   - 维修基金账户: 12 个');
    console.log(`   - 维修基金缴纳: ${mfPaymentCount} 条`);
    
    console.log('\n📋 下一步操作:');
    console.log('   1. 在 Directus Admin 中验证数据');
    console.log('   2. 配置权限: bash scripts/fix-resident-billing-permissions.sh');
    console.log('   3. 在应用中测试功能');
    
  } catch (error) {
    console.error('\n❌ 修复失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
