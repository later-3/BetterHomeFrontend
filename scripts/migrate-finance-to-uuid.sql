-- ============================================================
-- 财务表从 INTEGER 迁移到 UUID
-- 注意：此脚本会删除所有现有数据！
-- ============================================================

-- 开始事务
BEGIN;

-- ============================================================
-- 步骤 1: 删除所有现有数据
-- ============================================================

TRUNCATE TABLE salary_records CASCADE;
TRUNCATE TABLE maintenance_fund_usage CASCADE;
TRUNCATE TABLE maintenance_fund_payments CASCADE;
TRUNCATE TABLE maintenance_fund_accounts CASCADE;
TRUNCATE TABLE employees CASCADE;
TRUNCATE TABLE expenses CASCADE;
TRUNCATE TABLE billing_payments CASCADE;
TRUNCATE TABLE incomes CASCADE;
TRUNCATE TABLE billings CASCADE;

-- ============================================================
-- 步骤 2: 修改主键类型（INTEGER -> UUID）
-- ============================================================

-- 2.1 billings
ALTER TABLE billings
  DROP CONSTRAINT billings_pkey CASCADE;

ALTER TABLE billings
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE UUID USING gen_random_uuid();

DROP SEQUENCE IF EXISTS billings_id_seq;

ALTER TABLE billings
  ADD PRIMARY KEY (id);

-- 2.2 billing_payments
ALTER TABLE billing_payments
  DROP CONSTRAINT billing_payments_pkey CASCADE;

ALTER TABLE billing_payments
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE UUID USING gen_random_uuid();

DROP SEQUENCE IF EXISTS billing_payments_id_seq;

ALTER TABLE billing_payments
  ADD PRIMARY KEY (id);

-- 2.3 incomes
ALTER TABLE incomes
  DROP CONSTRAINT incomes_pkey CASCADE;

ALTER TABLE incomes
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE UUID USING gen_random_uuid();

DROP SEQUENCE IF EXISTS incomes_id_seq;

ALTER TABLE incomes
  ADD PRIMARY KEY (id);

-- 2.4 expenses
ALTER TABLE expenses
  DROP CONSTRAINT expenses_pkey CASCADE;

ALTER TABLE expenses
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE UUID USING gen_random_uuid();

DROP SEQUENCE IF EXISTS expenses_id_seq;

ALTER TABLE expenses
  ADD PRIMARY KEY (id);

-- 2.5 employees
ALTER TABLE employees
  DROP CONSTRAINT employees_pkey CASCADE;

ALTER TABLE employees
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE UUID USING gen_random_uuid();

DROP SEQUENCE IF EXISTS employees_id_seq;

ALTER TABLE employees
  ADD PRIMARY KEY (id);

-- 2.6 salary_records
ALTER TABLE salary_records
  DROP CONSTRAINT salary_records_pkey CASCADE;

ALTER TABLE salary_records
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE UUID USING gen_random_uuid();

DROP SEQUENCE IF EXISTS salary_records_id_seq;

ALTER TABLE salary_records
  ADD PRIMARY KEY (id);

-- 2.7 maintenance_fund_accounts
ALTER TABLE maintenance_fund_accounts
  DROP CONSTRAINT maintenance_fund_accounts_pkey CASCADE;

ALTER TABLE maintenance_fund_accounts
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE UUID USING gen_random_uuid();

DROP SEQUENCE IF EXISTS maintenance_fund_accounts_id_seq;

ALTER TABLE maintenance_fund_accounts
  ADD PRIMARY KEY (id);

-- 2.8 maintenance_fund_payments
ALTER TABLE maintenance_fund_payments
  DROP CONSTRAINT maintenance_fund_payments_pkey CASCADE;

ALTER TABLE maintenance_fund_payments
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE UUID USING gen_random_uuid();

DROP SEQUENCE IF EXISTS maintenance_fund_payments_id_seq;

ALTER TABLE maintenance_fund_payments
  ADD PRIMARY KEY (id);

-- 2.9 maintenance_fund_usage
ALTER TABLE maintenance_fund_usage
  DROP CONSTRAINT maintenance_fund_usage_pkey CASCADE;

ALTER TABLE maintenance_fund_usage
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE UUID USING gen_random_uuid();

DROP SEQUENCE IF EXISTS maintenance_fund_usage_id_seq;

ALTER TABLE maintenance_fund_usage
  ADD PRIMARY KEY (id);

-- ============================================================
-- 步骤 3: 修改外键类型（INTEGER -> UUID）
-- ============================================================

-- 3.1 billing_payments.billing_id -> billings.id
ALTER TABLE billing_payments
  ALTER COLUMN billing_id TYPE UUID USING gen_random_uuid();

-- 3.2 salary_records.employee_id -> employees.id
ALTER TABLE salary_records
  ALTER COLUMN employee_id TYPE UUID USING gen_random_uuid();

-- 3.3 salary_records.expense_id -> expenses.id
ALTER TABLE salary_records
  ALTER COLUMN expense_id TYPE UUID USING NULL::UUID;

-- 3.4 maintenance_fund_payments.account_id -> maintenance_fund_accounts.id
ALTER TABLE maintenance_fund_payments
  ALTER COLUMN account_id TYPE UUID USING gen_random_uuid();

-- 3.5 maintenance_fund_usage.expense_id -> expenses.id
ALTER TABLE maintenance_fund_usage
  ALTER COLUMN expense_id TYPE UUID USING NULL::UUID;

-- ============================================================
-- 步骤 4: 添加 period 字段到 billing_payments
-- ============================================================

ALTER TABLE billing_payments
  ADD COLUMN IF NOT EXISTS period VARCHAR(7);

COMMENT ON COLUMN billing_payments.period IS '所属账期（YYYY-MM格式），从关联的billing记录继承，用于权责发生制统计';

-- ============================================================
-- 步骤 5: 更新 Directus 字段元数据（通过 API）
-- ============================================================

-- 注意：以下操作需要通过 Directus API 完成
-- 见后续的 Node.js 脚本

-- ============================================================
-- 步骤 6: 验证迁移
-- ============================================================

-- 验证所有表的主键类型
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT
      table_name,
      column_name,
      data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN (
        'billings', 'billing_payments', 'incomes', 'expenses',
        'employees', 'salary_records',
        'maintenance_fund_accounts', 'maintenance_fund_payments', 'maintenance_fund_usage'
      )
      AND column_name = 'id'
  LOOP
    IF rec.data_type != 'uuid' THEN
      RAISE EXCEPTION 'Table %.id is %, expected uuid', rec.table_name, rec.data_type;
    END IF;
    RAISE NOTICE '✓ %.id is uuid', rec.table_name;
  END LOOP;

  RAISE NOTICE '✓ All primary keys migrated to UUID successfully';
END $$;

-- 验证 billing_payments.period 字段
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'billing_payments'
      AND column_name = 'period'
  ) THEN
    RAISE EXCEPTION 'billing_payments.period field not found';
  END IF;
  RAISE NOTICE '✓ billing_payments.period field exists';
END $$;

-- 提交事务
COMMIT;

-- ============================================================
-- 迁移完成提示
-- ============================================================

SELECT
  '迁移完成！' as status,
  '所有财务表已迁移到 UUID 主键' as message,
  'billing_payments 表已添加 period 字段' as note,
  '请运行 update-directus-metadata.js 脚本更新 Directus 元数据' as next_step;
