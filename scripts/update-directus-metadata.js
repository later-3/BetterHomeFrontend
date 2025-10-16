/**
 * 更新 Directus 字段元数据
 * 将财务表的 id 字段类型从 integer 更新为 uuid
 */

const DIRECTUS_URL = 'http://localhost:8055';
const ADMIN_TOKEN = 'sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n';

const tables = [
  'billings',
  'billing_payments',
  'incomes',
  'expenses',
  'employees',
  'salary_records',
  'maintenance_fund_accounts',
  'maintenance_fund_payments',
  'maintenance_fund_usage',
];

const foreignKeyFields = [
  { collection: 'billing_payments', field: 'billing_id', relatedCollection: 'billings' },
  { collection: 'salary_records', field: 'employee_id', relatedCollection: 'employees' },
  { collection: 'salary_records', field: 'expense_id', relatedCollection: 'expenses' },
  { collection: 'maintenance_fund_payments', field: 'account_id', relatedCollection: 'maintenance_fund_accounts' },
  { collection: 'maintenance_fund_usage', field: 'expense_id', relatedCollection: 'expenses' },
];

async function updateFieldType(collection, field, type) {
  const url = `${DIRECTUS_URL}/fields/${collection}/${field}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: type,
      schema: {
        data_type: type,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update ${collection}.${field}: ${error}`);
  }

  return response.json();
}

async function addPeriodField() {
  const url = `${DIRECTUS_URL}/fields/billing_payments`;

  // 检查字段是否已存在
  const checkResponse = await fetch(`${url}/period`, {
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
    },
  });

  if (checkResponse.ok) {
    console.log('✓ billing_payments.period field already exists');
    return;
  }

  // 创建字段
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      field: 'period',
      type: 'string',
      meta: {
        interface: 'input',
        width: 'half',
        note: '所属账期（YYYY-MM格式），从关联的billing记录继承，用于权责发生制统计',
        required: false,
      },
      schema: {
        data_type: 'character varying',
        max_length: 7,
        is_nullable: true,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to add period field: ${error}`);
  }

  console.log('✓ Added billing_payments.period field');
  return response.json();
}

async function main() {
  console.log('Starting Directus metadata update...\n');

  // 1. 更新主键类型
  console.log('Step 1: Updating primary key types to UUID...');
  for (const table of tables) {
    try {
      await updateFieldType(table, 'id', 'uuid');
      console.log(`  ✓ ${table}.id -> uuid`);
    } catch (error) {
      console.error(`  ✗ ${table}.id: ${error.message}`);
    }
  }

  // 2. 更新外键类型
  console.log('\nStep 2: Updating foreign key types to UUID...');
  for (const fk of foreignKeyFields) {
    try {
      await updateFieldType(fk.collection, fk.field, 'uuid');
      console.log(`  ✓ ${fk.collection}.${fk.field} -> uuid (-> ${fk.relatedCollection}.id)`);
    } catch (error) {
      console.error(`  ✗ ${fk.collection}.${fk.field}: ${error.message}`);
    }
  }

  // 3. 添加 period 字段
  console.log('\nStep 3: Adding period field to billing_payments...');
  try {
    await addPeriodField();
  } catch (error) {
    console.error(`  ✗ ${error.message}`);
  }

  console.log('\n✓ Directus metadata update completed!');
  console.log('\nNext steps:');
  console.log('1. 检查 Directus Admin UI 中的字段类型是否正确');
  console.log('2. 更新 TypeScript 类型定义');
  console.log('3. 重新生成测试数据');
}

main().catch(console.error);
