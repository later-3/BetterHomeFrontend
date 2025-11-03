 广告收益是几张表？

  3张表：

  1. ad_spots（广告位主数据表）

  - 存储广告位的基础信息
  - 关键字段：
    - spot_code: 广告位编号（如：AD-1-1-ELEVATOR）
    - spot_type: 类型（elevator=电梯广告，gate=闸机广告）
    - location: 位置描述（如：1号楼1单元电梯）
    - floor: 楼层（仅电梯广告）
    - size_spec: 尺寸规格（如：60cm×90cm）
    - base_price_monthly: 基础月租金
    - current_contract_id: 当前合同（如果已租出）
    - status: 状态（available/occupied/maintenance）

  2. ad_contracts（广告合同表）

  - 存储广告合同信息
  - 关键字段：
    - contract_no: 合同编号
    - spot_id: 关联广告位
    - advertiser_name: 广告主姓名
    - advertiser_company: 广告公司名称
    - advertiser_phone: 联系电话
    - contract_start: 合同开始日期
    - contract_end: 合同结束日期
    - monthly_rent: 月租金
    - total_amount: 合同总金额
    - deposit: 押金
    - deposit_status: 押金状态（none/paid/refunded）
    - status: 合同状态（active/completed/terminated）
    - contract_files: 合同文件（JSON数组）

  3. ad_details（广告收益详情表）

  - 连接receivables和ad_contracts的桥接表
  - 关键字段：
    - spot_id: 关联广告位
    - contract_id: 关联合同
    - receivable_id: 关联应收账单
    - payment_id: 关联缴费记录

  ---
  计算收益的方案

  方案：遵循统一的receivables+payments模式

  和停车租金一样，广告收益也采用标准的应收→实收模式：

  ad_contracts (广告合同)
      ↓ 合同信息：monthly_rent, contract_start, contract_end
  ad_details (连接详情)
      ↓ 每个合同1条记录
  receivables (广告租金应收，type_code='ad_revenue')
      ↓ 每月生成应收账单
  payments (广告租金实收，type_code='ad_revenue')
      ↓ 广告主缴费
  统计总收益: SUM(payments.amount WHERE type_code='ad_revenue')

  数据流程

  1. 创建广告合同：
    - 在 ad_contracts 表创建合同记录
    - 填写广告主信息、租期、月租金、押金等
    - 在 ad_details 表创建关联记录（连接合同和应收）
  2. 生成应收账单：
    - 根据合同的 contract_start 和 contract_end
    - 为每个月生成一条 receivables 记录
    - type_code='ad_revenue'
    - type_detail_id 指向对应的 ad_details.id
    - period 格式如 "2025-01"
  3. 缴费处理：
    - 广告主缴费时创建 payments 记录
    - type_code='ad_revenue'
    - 更新 receivables.payment_id
    - 更新 ad_details.payment_id
  4. 统计收益：
  const result = await aggregate("payments", {
    aggregate: { sum: ["amount"] },
    query: {
      filter: {
        type_code: { _eq: "ad_revenue" }
      }
    }
  });
  const adRevenue = Number(result?.[0]?.sum?.amount || 0);

  与停车租金的对比

  | 项目        | 停车租金                       | 广告收益                      |
  |-----------|----------------------------|---------------------------|
  | 主数据表      | parking_spots              | ad_spots                  |
  | 合同信息      | 字段存在parking_spots          | 单独的ad_contracts表          |
  | 详情表       | parking_details            | ad_details                |
  | type_code | parking_rent               | ad_revenue                |
  | 缴费对象      | 租户（renter_id）              | 广告主（advertiser信息在合同中）     |
  | 金额来源      | parking_spots.monthly_rent | ad_contracts.monthly_rent |

  关键区别：广告收益使用独立的 ad_contracts 表管理合同，而停车租金的合同信息直接存在 parking_spots 表中。这是因为：
  - 广告合同更复杂（广告主信息、押金、合同文件等）
  - 一个广告位可能有多个历史合同
  - 需要更详细的合同管理