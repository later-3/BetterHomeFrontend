/**
 * Directus 财务表创建脚本
 *
 * 使用方法：
 * 1. 获取Directus Admin Token:
 *    - 登录 http://localhost:8055/admin
 *    - 打开浏览器开发者工具 -> Application -> Local Storage
 *    - 找到 directus_token 的值
 *
 * 2. 运行脚本:
 *    DIRECTUS_ADMIN_TOKEN="your_token" tsx scripts/create-billing-tables.ts
 */

const DIRECTUS_URL = 'http://localhost:8055';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error('❌ 错误: 请设置 DIRECTUS_ADMIN_TOKEN 环境变量');
  console.log('\n使用方法:');
  console.log('DIRECTUS_ADMIN_TOKEN="your_token" tsx scripts/create-billing-tables.ts');
  process.exit(1);
}

interface DirectusResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string; extensions?: any }>;
}

async function apiCall<T = any>(
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<T> {
  const url = `${DIRECTUS_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data: DirectusResponse<T> = await response.json();

  if (data.errors && data.errors.length > 0) {
    throw new Error(data.errors[0].message);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return data.data as T;
}

// 创建 billings 表
async function createBillingsCollection() {
  console.log('📦 创建 billings 表...');

  try {
    await apiCall('/collections', 'POST', {
      collection: 'billings',
      meta: {
        collection: 'billings',
        icon: 'attach_money',
        note: '物业费账单表',
        display_template: null,
        hidden: false,
        singleton: false,
        translations: null,
        archive_field: 'date_deleted',
        archive_app_filter: true,
        archive_value: null,
        unarchive_value: null,
        sort_field: null,
      },
      schema: {
        name: 'billings',
      },
    });

    console.log('✅ billings 表创建成功');
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️  billings 表已存在');
    } else {
      throw error;
    }
  }
}

// 创建 billings 字段
async function createBillingsFields() {
  console.log('📝 创建 billings 字段...');

  const fields = [
    // 审计字段
    {
      collection: 'billings',
      field: 'user_created',
      type: 'uuid',
      meta: {
        special: ['user-created'],
        interface: 'select-dropdown-m2o',
        options: { template: '{{first_name}} {{last_name}}' },
        display: 'related-values',
        readonly: true,
        hidden: true,
      },
      schema: { is_nullable: true },
    },
    {
      collection: 'billings',
      field: 'date_created',
      type: 'timestamp',
      meta: {
        special: ['date-created'],
        interface: 'datetime',
        readonly: true,
        hidden: true,
      },
      schema: { is_nullable: true },
    },
    {
      collection: 'billings',
      field: 'user_updated',
      type: 'uuid',
      meta: {
        special: ['user-updated'],
        interface: 'select-dropdown-m2o',
        options: { template: '{{first_name}} {{last_name}}' },
        display: 'related-values',
        readonly: true,
        hidden: true,
      },
      schema: { is_nullable: true },
    },
    {
      collection: 'billings',
      field: 'date_updated',
      type: 'timestamp',
      meta: {
        special: ['date-updated'],
        interface: 'datetime',
        readonly: true,
        hidden: true,
      },
      schema: { is_nullable: true },
    },
    // 业务字段
    {
      collection: 'billings',
      field: 'community_id',
      type: 'uuid',
      meta: {
        interface: 'select-dropdown-m2o',
        options: { template: '{{name}}' },
        display: 'related-values',
        required: true,
      },
      schema: { is_nullable: false },
    },
    {
      collection: 'billings',
      field: 'building_id',
      type: 'uuid',
      meta: {
        interface: 'select-dropdown-m2o',
        options: { template: '{{name}}' },
        display: 'related-values',
      },
      schema: { is_nullable: true },
    },
    {
      collection: 'billings',
      field: 'owner_id',
      type: 'uuid',
      meta: {
        interface: 'select-dropdown-m2o',
        options: { template: '{{first_name}} {{last_name}}' },
        display: 'related-values',
        required: true,
      },
      schema: { is_nullable: false },
    },
    {
      collection: 'billings',
      field: 'amount',
      type: 'decimal',
      meta: {
        interface: 'input',
        required: true,
        note: '账单金额',
      },
      schema: {
        is_nullable: false,
        numeric_precision: 10,
        numeric_scale: 2,
      },
    },
    {
      collection: 'billings',
      field: 'period',
      type: 'string',
      meta: {
        interface: 'input',
        required: true,
        note: '账期，格式：YYYY-MM',
        width: 'half',
      },
      schema: {
        is_nullable: false,
        max_length: 7,
      },
    },
    {
      collection: 'billings',
      field: 'payment_method',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: '微信', value: 'wechat' },
            { text: '支付宝', value: 'alipay' },
            { text: '银行转账', value: 'bank' },
            { text: '现金', value: 'cash' },
            { text: '其他', value: 'other' },
          ],
        },
        width: 'half',
      },
      schema: {
        is_nullable: true,
        default_value: 'other',
      },
    },
    {
      collection: 'billings',
      field: 'status',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: '未缴', value: 'unpaid' },
            { text: '已缴', value: 'paid' },
            { text: '逾期', value: 'overdue' },
          ],
        },
        required: true,
        width: 'half',
      },
      schema: {
        is_nullable: false,
        default_value: 'unpaid',
      },
    },
    {
      collection: 'billings',
      field: 'paid_at',
      type: 'timestamp',
      meta: {
        interface: 'datetime',
        width: 'half',
      },
      schema: { is_nullable: true },
    },
    {
      collection: 'billings',
      field: 'late_fee',
      type: 'decimal',
      meta: {
        interface: 'input',
        note: '滞纳金（V2.0）',
        width: 'half',
      },
      schema: {
        is_nullable: true,
        numeric_precision: 10,
        numeric_scale: 2,
        default_value: 0,
      },
    },
    {
      collection: 'billings',
      field: 'notes',
      type: 'text',
      meta: {
        interface: 'input-multiline',
        note: '备注',
      },
      schema: { is_nullable: true },
    },
    {
      collection: 'billings',
      field: 'date_deleted',
      type: 'timestamp',
      meta: {
        interface: 'datetime',
        hidden: true,
      },
      schema: { is_nullable: true },
    },
  ];

  for (const field of fields) {
    try {
      await apiCall(`/fields/${field.collection}`, 'POST', field);
      console.log(`  ✅ 字段 ${field.field} 创建成功`);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log(`  ℹ️  字段 ${field.field} 已存在`);
      } else {
        console.error(`  ❌ 字段 ${field.field} 创建失败:`, error.message);
      }
    }
  }
}

// 创建 expenses 表
async function createExpensesCollection() {
  console.log('📦 创建 expenses 表...');

  try {
    await apiCall('/collections', 'POST', {
      collection: 'expenses',
      meta: {
        collection: 'expenses',
        icon: 'payments',
        note: '物业支出表',
        display_template: null,
        hidden: false,
        singleton: false,
        translations: null,
        archive_field: 'date_deleted',
        archive_app_filter: true,
        archive_value: null,
        unarchive_value: null,
        sort_field: null,
      },
      schema: {
        name: 'expenses',
      },
    });

    console.log('✅ expenses 表创建成功');
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️  expenses 表已存在');
    } else {
      throw error;
    }
  }
}

// 创建 expenses 字段
async function createExpensesFields() {
  console.log('📝 创建 expenses 字段...');

  const fields = [
    // 审计字段
    {
      collection: 'expenses',
      field: 'user_created',
      type: 'uuid',
      meta: {
        special: ['user-created'],
        interface: 'select-dropdown-m2o',
        options: { template: '{{first_name}} {{last_name}}' },
        display: 'related-values',
        readonly: true,
        hidden: true,
      },
      schema: { is_nullable: true },
    },
    {
      collection: 'expenses',
      field: 'date_created',
      type: 'timestamp',
      meta: {
        special: ['date-created'],
        interface: 'datetime',
        readonly: true,
        hidden: true,
      },
      schema: { is_nullable: true },
    },
    {
      collection: 'expenses',
      field: 'user_updated',
      type: 'uuid',
      meta: {
        special: ['user-updated'],
        interface: 'select-dropdown-m2o',
        options: { template: '{{first_name}} {{last_name}}' },
        display: 'related-values',
        readonly: true,
        hidden: true,
      },
      schema: { is_nullable: true },
    },
    {
      collection: 'expenses',
      field: 'date_updated',
      type: 'timestamp',
      meta: {
        special: ['date-updated'],
        interface: 'datetime',
        readonly: true,
        hidden: true,
      },
      schema: { is_nullable: true },
    },
    // 业务字段
    {
      collection: 'expenses',
      field: 'community_id',
      type: 'uuid',
      meta: {
        interface: 'select-dropdown-m2o',
        options: { template: '{{name}}' },
        display: 'related-values',
        required: true,
      },
      schema: { is_nullable: false },
    },
    {
      collection: 'expenses',
      field: 'title',
      type: 'string',
      meta: {
        interface: 'input',
        required: true,
        note: '支出标题',
      },
      schema: {
        is_nullable: false,
        max_length: 255,
      },
    },
    {
      collection: 'expenses',
      field: 'description',
      type: 'text',
      meta: {
        interface: 'input-multiline',
        note: '详细说明',
      },
      schema: { is_nullable: true },
    },
    {
      collection: 'expenses',
      field: 'amount',
      type: 'decimal',
      meta: {
        interface: 'input',
        required: true,
        note: '支出金额',
      },
      schema: {
        is_nullable: false,
        numeric_precision: 10,
        numeric_scale: 2,
      },
    },
    {
      collection: 'expenses',
      field: 'category',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: '维修', value: 'repair' },
            { text: '工资', value: 'salary' },
            { text: '清洁', value: 'cleaning' },
            { text: '保安', value: 'security' },
            { text: '公共水电', value: 'utilities' },
            { text: '绿化', value: 'greening' },
            { text: '电梯维护', value: 'elevator' },
            { text: '其他', value: 'other' },
          ],
        },
        required: true,
        width: 'half',
      },
      schema: { is_nullable: false },
    },
    {
      collection: 'expenses',
      field: 'paid_at',
      type: 'timestamp',
      meta: {
        interface: 'datetime',
        required: true,
        width: 'half',
      },
      schema: { is_nullable: false },
    },
    {
      collection: 'expenses',
      field: 'payment_method',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: '微信', value: 'wechat' },
            { text: '支付宝', value: 'alipay' },
            { text: '银行转账', value: 'bank' },
            { text: '现金', value: 'cash' },
            { text: '其他', value: 'other' },
          ],
        },
        width: 'half',
      },
      schema: {
        is_nullable: true,
        default_value: 'other',
      },
    },
    {
      collection: 'expenses',
      field: 'status',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: '待审核', value: 'pending' },
            { text: '已审核', value: 'approved' },
            { text: '已拒绝', value: 'rejected' },
          ],
        },
        required: true,
        width: 'half',
      },
      schema: {
        is_nullable: false,
        default_value: 'approved',
      },
    },
    {
      collection: 'expenses',
      field: 'approved_by',
      type: 'uuid',
      meta: {
        interface: 'select-dropdown-m2o',
        options: { template: '{{first_name}} {{last_name}}' },
        display: 'related-values',
        note: '审核人（V2.0）',
        width: 'half',
      },
      schema: { is_nullable: true },
    },
    {
      collection: 'expenses',
      field: 'approved_at',
      type: 'timestamp',
      meta: {
        interface: 'datetime',
        note: '审核时间（V2.0）',
        width: 'half',
      },
      schema: { is_nullable: true },
    },
    {
      collection: 'expenses',
      field: 'proof_files',
      type: 'json',
      meta: {
        interface: 'input-code',
        options: { language: 'json' },
        note: '凭证文件ID数组',
      },
      schema: { is_nullable: true },
    },
    {
      collection: 'expenses',
      field: 'created_by',
      type: 'uuid',
      meta: {
        interface: 'select-dropdown-m2o',
        options: { template: '{{first_name}} {{last_name}}' },
        display: 'related-values',
        required: true,
      },
      schema: { is_nullable: false },
    },
    {
      collection: 'expenses',
      field: 'date_deleted',
      type: 'timestamp',
      meta: {
        interface: 'datetime',
        hidden: true,
      },
      schema: { is_nullable: true },
    },
  ];

  for (const field of fields) {
    try {
      await apiCall(`/fields/${field.collection}`, 'POST', field);
      console.log(`  ✅ 字段 ${field.field} 创建成功`);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log(`  ℹ️  字段 ${field.field} 已存在`);
      } else {
        console.error(`  ❌ 字段 ${field.field} 创建失败:`, error.message);
      }
    }
  }
}

// 创建关系
async function createRelations() {
  console.log('🔗 创建表关系...');

  const relations = [
    // billings 关系
    {
      collection: 'billings',
      field: 'community_id',
      related_collection: 'communities',
      meta: {
        many_collection: 'billings',
        many_field: 'community_id',
        one_collection: 'communities',
        one_field: null,
        junction_field: null,
      },
      schema: {
        on_delete: 'SET NULL',
      },
    },
    {
      collection: 'billings',
      field: 'building_id',
      related_collection: 'buildings',
      meta: {
        many_collection: 'billings',
        many_field: 'building_id',
        one_collection: 'buildings',
        one_field: null,
        junction_field: null,
      },
      schema: {
        on_delete: 'SET NULL',
      },
    },
    {
      collection: 'billings',
      field: 'owner_id',
      related_collection: 'directus_users',
      meta: {
        many_collection: 'billings',
        many_field: 'owner_id',
        one_collection: 'directus_users',
        one_field: null,
        junction_field: null,
      },
      schema: {
        on_delete: 'SET NULL',
      },
    },
    // expenses 关系
    {
      collection: 'expenses',
      field: 'community_id',
      related_collection: 'communities',
      meta: {
        many_collection: 'expenses',
        many_field: 'community_id',
        one_collection: 'communities',
        one_field: null,
        junction_field: null,
      },
      schema: {
        on_delete: 'SET NULL',
      },
    },
    {
      collection: 'expenses',
      field: 'created_by',
      related_collection: 'directus_users',
      meta: {
        many_collection: 'expenses',
        many_field: 'created_by',
        one_collection: 'directus_users',
        one_field: null,
        junction_field: null,
      },
      schema: {
        on_delete: 'SET NULL',
      },
    },
    {
      collection: 'expenses',
      field: 'approved_by',
      related_collection: 'directus_users',
      meta: {
        many_collection: 'expenses',
        many_field: 'approved_by',
        one_collection: 'directus_users',
        one_field: null,
        junction_field: null,
      },
      schema: {
        on_delete: 'SET NULL',
      },
    },
  ];

  for (const relation of relations) {
    try {
      await apiCall('/relations', 'POST', relation);
      console.log(`  ✅ 关系 ${relation.collection}.${relation.field} -> ${relation.related_collection} 创建成功`);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log(`  ℹ️  关系 ${relation.collection}.${relation.field} 已存在`);
      } else {
        console.error(`  ❌ 关系 ${relation.collection}.${relation.field} 创建失败:`, error.message);
      }
    }
  }
}

// 主函数
async function main() {
  console.log('🚀 开始创建财务透明功能数据表...\n');

  try {
    // 创建 billings
    await createBillingsCollection();
    await createBillingsFields();

    console.log('');

    // 创建 expenses
    await createExpensesCollection();
    await createExpensesFields();

    console.log('');

    // 创建关系
    await createRelations();

    console.log('\n✅ 所有表创建完成！');
    console.log('\n📋 下一步:');
    console.log('1. 配置权限规则（见 docs/tasks/billing/design.md）');
    console.log('2. 更新 TypeScript 类型定义');
  } catch (error: any) {
    console.error('\n❌ 错误:', error.message);
    process.exit(1);
  }
}

main();
