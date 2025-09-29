<script setup lang="ts" name="register">
import { ref, computed, onMounted, nextTick } from 'vue';
import { updateMe } from '@directus/sdk';
import { useUserStore } from '@/store/user';
import directus, { communitiesApi, buildingsApi, registerDirectusUser } from '@/utils/directus';
import type { Community, Building } from '@/@types/directus-schema';
import env from '@/config/env';

interface CascaderNode {
  value: string;
  label: string;
  children?: CascaderNode[];
}

const DEFAULT_AVATAR = '/static/avatar-default.png';
const REGISTER_PASSWORD = '123456';
const USERNAME_SUFFIX = '@test.com';

const userStore = useUserStore();

const formRef = ref();
const form = ref({
  username: '',
  password: '',
  phone: '',
  communityId: '',
  buildingId: ''
});

const avatarPath = ref(DEFAULT_AVATAR);
const hasCustomAvatar = computed(() => avatarPath.value !== DEFAULT_AVATAR);

const cascaderVisible = ref(false);
const cascaderOptions = ref<CascaderNode[]>([]);
const cascaderSelection = ref<string[]>([]);
const cascaderReady = ref(false);

const loadingCascade = ref(false);
const submitting = ref(false);

const selectedPathText = computed(() => {
  const communityId = form.value.communityId;
  const buildingId = form.value.buildingId;
  const community = cascaderOptions.value.find((item) => item.value === communityId);
  const building = community?.children?.find((child) => child.value === buildingId);
  return [community?.label, building?.label].filter(Boolean).join(' / ');
});

const formRules = {
  username: [{ required: true, message: '请输入用户名', trigger: ['blur', 'change'] }],
  password: [{ required: true, message: '请输入密码', trigger: ['blur', 'change'] }]
};

function buildEmailFromUsername(rawUsername: string): string {
  const suffix = USERNAME_SUFFIX;
  const normalized = rawUsername
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.+|\.+$/g, '');
  const localPart = normalized || `user.${Date.now()}`;
  return `${localPart}${suffix}`;
}

onMounted(() => {
  void refreshCascadeData();
});

function extractData<T>(source: any): T[] {
  if (Array.isArray(source?.data)) return source.data as T[];
  if (Array.isArray(source)) return source as T[];
  return [];
}

async function refreshCascadeData() {
  loadingCascade.value = true;
  cascaderReady.value = false;
  try {
    const communityResponse = await communitiesApi.readMany({
      fields: ['id', 'name', 'address'],
      sort: ['name']
    });
    const communityList = extractData<Community>(communityResponse);

    let buildingList: Building[] = [];
    if (communityList.length) {
      const buildingResponse = await buildingsApi.readMany({
        fields: ['id', 'name', 'community_id'],
        filter: { community_id: { _in: communityList.map((item) => item.id) } },
        sort: ['name']
      });
      buildingList = extractData<Building>(buildingResponse);
    }

    const buildingMap = buildingList.reduce<Record<string, CascaderNode[]>>((acc, current) => {
      const communityId =
        typeof current.community_id === 'string'
          ? current.community_id
          : current.community_id?.id ?? '';
      if (!communityId) return acc;
      if (!acc[communityId]) acc[communityId] = [];
      acc[communityId].push({
        value: current.id,
        label: current.name ?? '未命名楼栋'
      });
      return acc;
    }, {});

    cascaderOptions.value = communityList.map((community) => ({
      value: community.id,
      label: community.name ?? '未命名小区',
      children: buildingMap[community.id] ?? []
    }));

    cascaderReady.value = cascaderOptions.value.length > 0;

    if (!form.value.communityId && cascaderOptions.value.length) {
      const first = cascaderOptions.value[0];
      const defaults = [first.value];
      if (first.children?.[0]?.value) defaults.push(first.children[0].value);
      applySelection(defaults);
    } else if (form.value.communityId) {
      const current = [form.value.communityId];
      if (form.value.buildingId) current.push(form.value.buildingId);
      cascaderSelection.value = current;
    }
  } catch (error: any) {
    uni.showToast({ title: error?.message || '获取小区失败', icon: 'none' });
  } finally {
    loadingCascade.value = false;
  }
}

function applySelection(values: string[]) {
  cascaderSelection.value = [...values];
  form.value.communityId = values[0] ?? '';
  form.value.buildingId = values[1] ?? '';
}

function openCascader() {
  if (loadingCascade.value) {
    uni.showToast({ title: '正在加载小区数据', icon: 'none' });
    return;
  }
  if (!cascaderReady.value) {
    uni.showToast({ title: '暂无小区数据', icon: 'none' });
    return;
  }
  if (!cascaderSelection.value.length) {
    if (form.value.communityId) {
      const current = [form.value.communityId];
      if (form.value.buildingId) current.push(form.value.buildingId);
      cascaderSelection.value = current;
    } else if (cascaderOptions.value.length) {
      const first = cascaderOptions.value[0];
      const defaults = [first.value];
      if (first.children?.[0]?.value) defaults.push(first.children[0].value);
      cascaderSelection.value = defaults;
    }
  }
  nextTick(() => {
    cascaderVisible.value = true;
  });
}

function handleCascaderConfirm(values: string[]) {
  applySelection(values);
  cascaderVisible.value = false;
}

function chooseAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ['original', 'compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      if (res.tempFilePaths && res.tempFilePaths[0]) {
        avatarPath.value = res.tempFilePaths[0];
      }
    },
    fail: () => {
      uni.showToast({ title: '选择头像失败', icon: 'none' });
    }
  });
}

async function uploadAvatar() {
  if (!hasCustomAvatar.value) return;
  if (!userStore.token) {
    uni.showToast({ title: '登录状态异常，头像未上传', icon: 'none' });
    return;
  }
  try {
    const uploadRes = await uni.uploadFile({
      url: `${env.directusUrl}/files`,
      filePath: avatarPath.value,
      name: 'file',
      header: {
        Authorization: `Bearer ${userStore.token}`
      }
    });

    if (uploadRes.statusCode >= 200 && uploadRes.statusCode < 300) {
      const payload = JSON.parse(uploadRes.data || '{}');
      const fileId = payload?.data?.id ?? payload?.data?.data?.id ?? payload?.id;
      if (fileId) {
        await directus.request(updateMe({ avatar: fileId }));
        await userStore.fetchProfile();
      }
    } else {
      uni.showToast({ title: '头像上传失败', icon: 'none' });
    }
  } catch (error) {
    uni.showToast({ title: '头像上传失败', icon: 'none' });
  }
}

async function handleRegister() {
  try {
    await formRef.value?.validate?.();
  } catch (error) {
    return;
  }

  if (!form.value.communityId) {
    uni.showToast({ title: '请选择小区', icon: 'none' });
    return;
  }

  submitting.value = true;

  try {
    const username = form.value.username.trim();
    const defaultLastName = '用户';
    const email = buildEmailFromUsername(username);
    const password = form.value.password.trim() || REGISTER_PASSWORD;

    await registerDirectusUser(email, password, {
      first_name: username,
      last_name: defaultLastName
    });

    await userStore.login({ email, password });

    const userId = userStore.profile?.id ?? '';

    if (userId) {
      const updatePayload: Record<string, any> = {
        first_name: username,
        last_name: defaultLastName,
        status: 'active',
        community_id: form.value.communityId,
        building_id: form.value.buildingId || null,
        user_type: 'resident'
      };
      if (form.value.phone.trim()) {
        updatePayload.phone = form.value.phone.trim();
      }
      await directus.request(updateMe(updatePayload));
      await uploadAvatar();
      await userStore.fetchProfile();
      await userStore.fetchContext();
    }

    uni.showToast({ title: '注册成功', icon: 'success' });
    setTimeout(() => uni.switchTab({ url: '/pages/profile/profile' }), 600);
  } catch (error: any) {
    uni.showToast({ title: error?.message || '注册失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <view class="register-page">
    <up-card class="register-card" :showHead="false" :border="false">
      <template #body>
        <view class="section">
          <view class="section-title">头像</view>
          <view class="avatar-row">
            <up-avatar :src="avatarPath" size="110" shape="circle" />
            <up-button text="选择头像" type="primary" plain size="small" @click="chooseAvatar" />
          </view>
        </view>

        <view class="section">
          <view class="section-title">基本信息</view>
          <up-form ref="formRef" :model="form" :rules="formRules" labelPosition="top">
            <up-form-item label="用户名" prop="username">
              <up-input
                v-model="form.username"
                placeholder="请输入用户名"
                clearable
                prefixIcon="account"
              />
            </up-form-item>
            <up-form-item label="密码" prop="password">
              <up-input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                clearable
                prefixIcon="lock"
              />
            </up-form-item>
            <up-form-item>
              <up-input
                v-model="form.phone"
                type="number"
                placeholder="请输入联系电话"
                clearable
                prefixIcon="phone"
              />
            </up-form-item>
          </up-form>
        </view>

        <view class="section">
          <view class="section-title">小区 / 楼栋</view>
          <up-cell-group>
            <up-cell
              title="小区 / 楼栋"
              :value="selectedPathText || (loadingCascade ? '加载中...' : '请选择')"
              :isLink="cascaderReady && !loadingCascade"
              @click="openCascader"
            />
          </up-cell-group>
        </view>

        <up-button
          class="submit-button"
          type="primary"
          shape="circle"
          :loading="submitting"
          loadingText="注册中"
          text="注册"
          @click="handleRegister"
        />
      </template>
    </up-card>

    <up-cascader
      v-if="cascaderReady"
      v-model:show="cascaderVisible"
      v-model="cascaderSelection"
      :data="cascaderOptions"
      header-direction="column"
      :options-cols="1"
      :auto-close="false"
      @confirm="handleCascaderConfirm"
    />
  </view>
</template>

<style scoped lang="scss">
.register-page {
  min-height: 100vh;
  padding: 32rpx;
  background: #f5f5f5;
}

.register-card {
  border-radius: 24rpx;
  box-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.08);
}

.section {
  margin-bottom: 40rpx;
}

.section-title {
  margin-bottom: 20rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: #1aa86c;
}

.avatar-row {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.submit-button {
  margin-top: 20rpx;
}
</style>
