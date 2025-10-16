<template>
    <view class="my-billings-page">
        <!-- 页面标题 -->
        <view class="page-header">
            <text class="page-title">我的物业费</text>
            <text class="page-subtitle">查看缴费记录和账单状态</text>
        </view>

        <!-- 筛选器 -->
        <view class="filters">
            <!-- 状态筛选 -->
            <view class="filter-group">
                <text class="filter-label">状态筛选</text>
                <view class="filter-tabs">
                    <view v-for="status in statusOptions" :key="status.value" class="filter-tab"
                        :class="{ active: selectedStatus === status.value }" @click="onStatusChange(status.value)">
                        <text>{{ status.label }}</text>
                    </view>
                </view>
            </view>

            <!-- 账期筛选 -->
            <view class="filter-group">
                <text class="filter-label">账期筛选</text>
                <picker mode="date" fields="month" :value="selectedPeriod" @change="onPeriodChange">
                    <view class="period-picker">
                        <text>{{ selectedPeriod || "选择账期" }}</text>
                        <text class="picker-arrow">▼</text>
                    </view>
                </picker>
                <button v-if="selectedPeriod" @click="clearPeriodFilter" size="mini">
                    清除
                </button>
            </view>
        </view>

        <!-- 汇总信息 -->
        <view class="summary-section">
            <view class="summary-card">
                <text class="summary-label">总应缴</text>
                <text class="summary-amount total">{{ formatAmount(summary.totalBilling) }}</text>
            </view>
            <view class="summary-card">
                <text class="summary-label">已缴纳</text>
                <text class="summary-amount paid">{{ formatAmount(summary.totalPaid) }}</text>
            </view>
            <view class="summary-card">
                <text class="summary-label">待缴费</text>
                <text class="summary-amount unpaid">{{ formatAmount(summary.totalUnpaid) }}</text>
            </view>
        </view>

        <!-- 加载状态 -->
        <view v-if="loading" class="loading">
            <text>加载中...</text>
        </view>

        <!-- 错误状态 -->
        <view v-if="error" class="error">
            <text>{{ error }}</text>
            <button @click="loadData" size="mini">重试</button>
        </view>

        <!-- 账单列表 -->
        <view v-if="!loading && !error" class="billings-section">
            <view class="section-header">
                <text class="section-title">账单记录</text>
                <text class="section-count">共 {{ filteredBillings.length }} 条</text>
            </view>

            <view class="billings-list">
                <view v-for="billing in filteredBillings" :key="billing.id" class="billing-item"
                    @click="goToBillingDetail(billing.id)">
                    <!-- 账单基本信息 -->
                    <view class="billing-header">
                        <view class="billing-period">
                            <text class="period-text">{{ billing.period }}</text>
                            <view class="status-badge" :class="getStatusClass(billing.status)">
                                <text class="status-text">{{ getStatusText(billing.status) }}</text>
                            </view>
                        </view>
                        <view class="billing-amounts">
                            <text class="amount-due">应缴: {{ formatAmount(billing.billing_amount) }}</text>
                            <text class="amount-paid">已缴: {{ formatAmount(billing.paid_amount ?? 0) }}</text>
                        </view>
                    </view>

                    <!-- 账单详细信息 -->
                    <view class="billing-details">
                        <view class="detail-row">
                            <text class="detail-label">面积</text>
                            <text class="detail-value">{{ billing.area }}㎡</text>
                        </view>
                        <view class="detail-row">
                            <text class="detail-label">单价</text>
                            <text class="detail-value">{{ formatAmount(billing.unit_price ?? 0) }}/㎡</text>
                        </view>
                        <view class="detail-row">
                            <text class="detail-label">到期日</text>
                            <text class="detail-value">{{ billing.due_date ? formatDate(billing.due_date) : '未设置'
                                }}</text>
                        </view>
                        <view v-if="billing.late_fee && billing.late_fee > 0" class="detail-row">
                            <text class="detail-label">滞纳金</text>
                            <text class="detail-value late-fee">{{ formatAmount(billing.late_fee ?? 0) }}</text>
                        </view>
                    </view>

                    <!-- 欠费提醒 -->
                    <view v-if="isOverdue(billing)" class="overdue-notice">
                        <text class="notice-text">⚠️ 已逾期，请尽快缴费</text>
                    </view>
                </view>

                <!-- 空状态 -->
                <view v-if="filteredBillings.length === 0" class="empty-state">
                    <text class="empty-text">暂无账单记录</text>
                    <text class="empty-hint">{{ getEmptyHint() }}</text>
                </view>
            </view>

            <!-- 加载更多 -->
            <view v-if="hasMore && filteredBillings.length > 0" class="load-more">
                <button @click="loadMore" :disabled="loading" size="mini">
                    {{ loading ? "加载中..." : "加载更多" }}
                </button>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useFinanceStore } from "@/store/finance";
import { formatAmount, formatDate } from "@/utils/finance-labels";
import type { Billing } from "@/@types/directus-schema";

const financeStore = useFinanceStore();

// 状态选项
const statusOptions = [
    { value: "", label: "全部" },
    { value: "unpaid", label: "未缴" },
    { value: "paid", label: "已缴" },
    { value: "partial", label: "部分缴纳" },
    { value: "overdue", label: "逾期" },
];

// 筛选状态
const selectedStatus = ref("");
const selectedPeriod = ref("");

// 页面状态
const loading = ref(false);
const error = ref<string | null>(null);

// 计算属性
const billings = computed(() => financeStore.myBillings);
const hasMore = computed(() => financeStore.billingsHasMore);

// 汇总信息
const summary = computed(() => ({
    totalBilling: financeStore.myTotalBilling,
    totalPaid: financeStore.myTotalPaid,
    totalUnpaid: financeStore.myTotalUnpaid,
}));

// 筛选后的账单
const filteredBillings = computed(() => {
    let filtered = billings.value;

    // 按状态筛选
    if (selectedStatus.value) {
        filtered = filtered.filter((billing) => billing.status === selectedStatus.value);
    }

    // 按账期筛选
    if (selectedPeriod.value) {
        filtered = filtered.filter((billing) => billing.period === selectedPeriod.value);
    }

    return filtered;
});

// 获取状态文本
function getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
        unpaid: "未缴",
        paid: "已缴",
        partial: "部分缴纳",
        overdue: "逾期",
    };
    return statusMap[status] || status;
}

// 获取状态样式类
function getStatusClass(status: string): string {
    return `status-${status}`;
}

// 判断是否逾期
function isOverdue(billing: Billing): boolean {
    if (billing.status === "paid") return false;
    if (!billing.due_date) return false;

    const dueDate = new Date(billing.due_date);
    const now = new Date();
    return now > dueDate;
}

// 获取空状态提示
function getEmptyHint(): string {
    if (selectedStatus.value) {
        return `暂无${getStatusText(selectedStatus.value)}的账单`;
    }
    if (selectedPeriod.value) {
        return `${selectedPeriod.value}暂无账单记录`;
    }
    return "请联系物业了解详情";
}

// 状态筛选改变
function onStatusChange(status: string) {
    selectedStatus.value = status;
}

// 账期筛选改变
function onPeriodChange(e: any) {
    selectedPeriod.value = e.detail.value;
}

// 清除账期筛选
function clearPeriodFilter() {
    selectedPeriod.value = "";
}

// 加载数据
async function loadData() {
    loading.value = true;
    error.value = null;

    try {
        await financeStore.fetchMyBillings(true);
    } catch (e: any) {
        error.value = e.message || "加载失败";
    } finally {
        loading.value = false;
    }
}

// 加载更多
async function loadMore() {
    if (loading.value || !hasMore.value) return;

    try {
        await financeStore.fetchMyBillings(false);
    } catch (e: any) {
        error.value = e.message || "加载更多失败";
    }
}

// 跳转到账单详情
function goToBillingDetail(billingId: string) {
    uni.navigateTo({
        url: `/pages/finance/billing-detail?id=${billingId}`,
    });
}

onMounted(() => {
    loadData();
});
</script>

<style scoped>
.my-billings-page {
    padding: 20rpx;
    background: #f5f5f5;
    min-height: 100vh;
}

.page-header {
    padding: 30rpx 20rpx;
    background: white;
    border-radius: 8rpx;
    margin-bottom: 20rpx;
}

.page-title {
    font-size: 36rpx;
    font-weight: bold;
    display: block;
    margin-bottom: 10rpx;
}

.page-subtitle {
    font-size: 24rpx;
    color: #999;
}

.filters {
    background: white;
    border-radius: 8rpx;
    padding: 20rpx;
    margin-bottom: 20rpx;
}

.filter-group {
    margin-bottom: 20rpx;
}

.filter-group:last-child {
    margin-bottom: 0;
}

.filter-label {
    font-size: 28rpx;
    font-weight: 500;
    display: block;
    margin-bottom: 15rpx;
}

.filter-tabs {
    display: flex;
    gap: 15rpx;
    flex-wrap: wrap;
}

.filter-tab {
    padding: 12rpx 24rpx;
    background: #f5f5f5;
    border-radius: 20rpx;
    border: 2rpx solid transparent;
}

.filter-tab.active {
    background: #e6f7ff;
    border-color: #1890ff;
}

.filter-tab text {
    font-size: 26rpx;
    color: #666;
}

.filter-tab.active text {
    color: #1890ff;
    font-weight: 500;
}

.period-picker {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15rpx 20rpx;
    background: #f5f5f5;
    border-radius: 8rpx;
    margin-bottom: 10rpx;
}

.picker-arrow {
    font-size: 20rpx;
    color: #999;
}

.summary-section {
    display: flex;
    gap: 15rpx;
    margin-bottom: 20rpx;
}

.summary-card {
    flex: 1;
    padding: 25rpx 15rpx;
    background: white;
    border-radius: 8rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.summary-label {
    font-size: 24rpx;
    color: #666;
    margin-bottom: 8rpx;
}

.summary-amount {
    font-size: 32rpx;
    font-weight: bold;
}

.summary-amount.total {
    color: #1890ff;
}

.summary-amount.paid {
    color: #52c41a;
}

.summary-amount.unpaid {
    color: #ff4d4f;
}

.loading,
.error {
    padding: 40rpx;
    text-align: center;
    background: white;
    border-radius: 8rpx;
    margin-bottom: 20rpx;
}

.billings-section {
    background: white;
    border-radius: 8rpx;
    padding: 20rpx;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
}

.section-title {
    font-size: 32rpx;
    font-weight: bold;
}

.section-count {
    font-size: 24rpx;
    color: #999;
}

.billings-list {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
}

.billing-item {
    padding: 20rpx;
    background: #f8f9fa;
    border-radius: 8rpx;
    border-left: 4rpx solid #1890ff;
}

.billing-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15rpx;
}

.billing-period {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.period-text {
    font-size: 32rpx;
    font-weight: bold;
}

.status-badge {
    padding: 4rpx 12rpx;
    border-radius: 12rpx;
    align-self: flex-start;
}

.status-text {
    font-size: 22rpx;
    color: white;
}

.status-paid {
    background: #52c41a;
}

.status-unpaid {
    background: #ff4d4f;
}

.status-partial {
    background: #faad14;
}

.status-overdue {
    background: #f5222d;
}

.billing-amounts {
    display: flex;
    flex-direction: column;
    gap: 5rpx;
    align-items: flex-end;
}

.amount-due,
.amount-paid {
    font-size: 26rpx;
}

.amount-due {
    color: #666;
}

.amount-paid {
    color: #52c41a;
    font-weight: 500;
}

.billing-details {
    display: flex;
    flex-direction: column;
    gap: 10rpx;
    margin-bottom: 15rpx;
}

.detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.detail-label {
    font-size: 24rpx;
    color: #666;
}

.detail-value {
    font-size: 24rpx;
    color: #333;
}

.detail-value.late-fee {
    color: #ff4d4f;
    font-weight: 500;
}

.overdue-notice {
    padding: 10rpx 15rpx;
    background: #fff2f0;
    border: 1rpx solid #ffccc7;
    border-radius: 6rpx;
}

.notice-text {
    font-size: 24rpx;
    color: #ff4d4f;
}

.empty-state {
    padding: 60rpx 20rpx;
    text-align: center;
}

.empty-text {
    font-size: 28rpx;
    color: #999;
    display: block;
    margin-bottom: 10rpx;
}

.empty-hint {
    font-size: 24rpx;
    color: #ccc;
}

.load-more {
    padding: 30rpx;
    text-align: center;
}
</style>