/**
 * 财务类型标签映射
 * 用于将后端枚举值转换为前端显示文本
 */

// 收入类型标签映射
export const INCOME_TYPE_LABELS: Record<string, string> = {
  advertising: "广告收益",
  parking: "停车费",
  venue_rental: "场地租赁",
  vending: "自动售货",
  express_locker: "快递柜",
  recycling: "废品回收",
  other: "其他收入",
};

// 支出类型标签映射
export const EXPENSE_TYPE_LABELS: Record<string, string> = {
  salary: "员工工资",
  maintenance: "维修费用",
  utilities: "水电费",
  materials: "物料采购",
  activity: "活动经费",
  committee_fund: "业委会经费",
  maintenance_fund: "维修基金",
  other: "其他支出",
};

// 支付方式标签映射
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  wechat: "微信支付",
  alipay: "支付宝",
  bank: "银行转账",
  cash: "现金",
  pos: "POS机",
  other: "其他",
};

// 获取收入类型标签
export function getIncomeTypeLabel(type: string): string {
  return INCOME_TYPE_LABELS[type] || type;
}

// 获取支出类型标签
export function getExpenseTypeLabel(type: string): string {
  return EXPENSE_TYPE_LABELS[type] || type;
}

// 获取支付方式标签
export function getPaymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method] || method;
}

// 格式化金额
export function formatAmount(amount: number): string {
  return `¥${amount.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// 格式化百分比
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

// 格式化日期
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// 格式化时间
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
