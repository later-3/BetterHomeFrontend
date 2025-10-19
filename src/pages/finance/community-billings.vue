<template>
  <view class="community-billings-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">小区物业费管理</text>
      <text class="page-subtitle">兰亭雅苑 - 所有业主缴费情况</text>
    </view>

    <!-- 汇总信息 -->
    <view class="summary-section">
      <view class="summary-card">
        <text class="summary-label">总业主数</text>
        <text class="summary-value">{{ totalUsers }}</text>
      </view>
      <view class="summary-card">
        <text class="summary-label">未欠费</text>
        <text class="summary-value paid">{{ paidUsers }}</text>
      </view>
      <view class="summary-card">
        <text class="summary-label">欠费中</text>
        <text class="summary-value unpaid">{{ unpaidUsers }}</text>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <up-loading-icon mode="circle" size="40" />
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 错误状态 -->
    <view v-else-if="error" class="error-container">
      <text class="error-text">{{ error }}</text>
      <up-button text="重试" type="primary" size="small" @click="loadData" />
    </view>

    <!-- 用户列表 -->
    <view v-else class="users-section">
      <up-cell-group :border="false">
        <up-cell
          v-for="user in usersList"
          :key="user.id"
          :title="user.name"
          isLink
          @click="goToUserDetail(user)"
        >
          <template #icon>
            <up-avatar :src="user.avatar" size="45" shape="circle" />
          </template>
          <template #value>
            <view class="user-status-badge" :class="user.statusClass">
              <text class="status-text">{{ user.statusText }}</text>
            </view>
          </template>
        </up-cell>
      </up-cell-group>

      <!-- 空状态 -->
      <view v-if="usersList.length === 0" class="empty-state">
        <text class="empty-text">暂无业主数据</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { directusClient, billingsApi } from "@/utils/directus";
import { readUsers, readRoles } from "@directus/sdk";
import type { Billing, DirectusFile } from "@/@types/directus-schema";
import env from "@/config/env";

interface UserBillingInfo {
  id: string;
  name: string;
  avatar: string;
  statusText: string;
  statusClass: string;
}

const loading = ref(false);
const error = ref<string | null>(null);
const usersList = ref<UserBillingInfo[]>([]);

const totalUsers = computed(() => usersList.value.length);
const paidUsers = computed(() => usersList.value.filter(u => u.statusClass === "status-paid").length);
const unpaidUsers = computed(() => usersList.value.filter(u => u.statusClass === "status-unpaid").length);

// 获取用户默认头像
function getDefaultAvatar(): string {
  return "/static/avatar-default.png";
}

// 构建资源 URL
function buildAssetUrl(file: DirectusFile | string): string {
  const fileId = typeof file === "string" ? file : file.id;
  return `${env.directusUrl}/assets/${fileId}`;
}

// 获取上个月的 period
function getLastMonthPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11，0 是 1 月

  if (month === 0) {
    // 如果当前是1月，上个月是去年12月
    return `${year - 1}-12`;
  } else {
    return `${year}-${String(month).padStart(2, "0")}`;
  }
}

// 加载数据
async function loadData() {
  loading.value = true;
  error.value = null;

  try {
    // 1. 获取resident角色ID
    const rolesResult = await directusClient.request(
      readRoles({
        filter: { name: { _eq: "resident" } },
        fields: ["id", "name"],
        limit: 1,
      })
    );

    if (!rolesResult || rolesResult.length === 0) {
      throw new Error("未找到resident角色");
    }

    const residentRoleId = rolesResult[0].id;

    // 2. 获取所有resident用户
    const users = await directusClient.request(
      readUsers({
        filter: { role: { _eq: residentRoleId } },
        fields: ["id", "first_name", "last_name", "email", "avatar"],
        limit: 1000,
      })
    );

    if (!users || users.length === 0) {
      usersList.value = [];
      return;
    }

    // 3. 获取所有账单数据
    const allBillings = await billingsApi.readMany({
      filter: {
        period: {
          _in: ["2025-01", "2025-02", "2025-03", "2025-04", "2025-05",
                "2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12"]
        },
      },
      fields: ["id", "owner_id", "period", "amount", "is_paid"],
      limit: 1000,
    } as any) as any;

    const billings = (Array.isArray(allBillings) ? allBillings : []) as Billing[];

    // 4. 聚合每个用户的账单信息
    const lastMonthPeriod = getLastMonthPeriod();

    const usersInfo: UserBillingInfo[] = users.map((user: any) => {
      // 找到该用户上个月的账单
      const lastMonthBilling = billings.find(
        b => b.owner_id === user.id && b.period === lastMonthPeriod
      );

      let statusText = "";
      let statusClass = "";

      if (!lastMonthBilling) {
        // 没有上个月的账单记录，算作未欠费（可能是新用户）
        statusText = "未欠费";
        statusClass = "status-paid";
      } else if (lastMonthBilling.is_paid) {
        // 上个月已缴费
        statusText = "未欠费";
        statusClass = "status-paid";
      } else {
        // 上个月未缴费
        statusText = "欠费";
        statusClass = "status-unpaid";
      }

      return {
        id: user.id,
        name: user.first_name || user.last_name || user.email || "未命名用户",
        avatar: user.avatar ? buildAssetUrl(user.avatar) : getDefaultAvatar(),
        statusText,
        statusClass,
      };
    });

    // 按欠费情况排序：欠费在前，未欠费在后
    usersInfo.sort((a, b) => {
      if (a.statusClass !== b.statusClass) {
        // status-unpaid 排在前面
        return a.statusClass === "status-unpaid" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    usersList.value = usersInfo;
  } catch (e: any) {
    console.error("[community-billings] 加载失败:", e);
    error.value = e.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

// 跳转到用户详情
function goToUserDetail(user: UserBillingInfo) {
  uni.navigateTo({
    url: `/pages/finance/user-billing-detail?userId=${user.id}&userName=${encodeURIComponent(user.name)}&userAvatar=${encodeURIComponent(user.avatar)}`,
  });
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.community-billings-page {
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

.summary-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #1890ff;
}

.summary-value.paid {
  color: #52c41a;
}

.summary-value.unpaid {
  color: #ff4d4f;
}

.loading-container,
.error-container {
  padding: 60rpx 20rpx;
  text-align: center;
  background: white;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

.error-text {
  font-size: 28rpx;
  color: #ff4d4f;
  margin-bottom: 10rpx;
}

.users-section {
  background: white;
  border-radius: 8rpx;
  overflow: hidden;
}

.user-status-badge {
  padding: 6rpx 16rpx;
  border-radius: 16rpx;
}

.user-status-badge.status-paid {
  background: #f6ffed;
  border: 1rpx solid #b7eb8f;
}

.user-status-badge.status-unpaid {
  background: #fff2f0;
  border: 1rpx solid #ffccc7;
}

.status-text {
  font-size: 24rpx;
  font-weight: 500;
}

.user-status-badge.status-paid .status-text {
  color: #52c41a;
}

.user-status-badge.status-unpaid .status-text {
  color: #ff4d4f;
}

.empty-state {
  padding: 60rpx 20rpx;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>
