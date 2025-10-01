<script setup lang="ts" name="login">
import { ref } from "vue";
import { useUserStore } from "@/store/user";
import type { LoginCredentials } from "@/store/user";

const USERNAME_SUFFIX = "@test.com";

const formRef = ref();
const credentials = ref({
  username: "test",
  password: "123456",
});

const formRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: ["blur", "change"] },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: ["blur", "change"] },
    { min: 6, message: "密码至少6位", trigger: "blur" },
  ],
};

function buildEmailFromUsername(raw: string): string {
  const normalized = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  const localPart = normalized || `user.${Date.now()}`;
  return `${localPart}${USERNAME_SUFFIX}`;
}

const userStore = useUserStore();

async function handleLogin() {
  try {
    await formRef.value?.validate?.();
  } catch (error) {
    return;
  }

  try {
    const payload: LoginCredentials = {
      email: buildEmailFromUsername(credentials.value.username),
      password: credentials.value.password,
    };
    await userStore.login(payload);
    uni.showToast({ title: "登录成功", icon: "success" });
    uni.navigateBack({ delta: 1 });
  } catch (error) {
    // handleDirectusError 已处理具体提示
  }
}
</script>

<template>
  <view class="login-page">
    <up-card :showHead="false" :border="false" class="login-card">
      <template #body>
        <view class="card-title">账号登录</view>
        <up-form
          ref="formRef"
          :model="credentials"
          :rules="formRules"
          labelPosition="top"
        >
          <up-form-item label="用户名" prop="username">
            <up-input
              v-model="credentials.username"
              type="text"
              clearable
              placeholder="请输入用户名"
              prefixIcon="account"
            />
          </up-form-item>
          <up-form-item label="密码" prop="password">
            <up-input
              v-model="credentials.password"
              type="password"
              clearable
              placeholder="请输入密码"
              prefixIcon="lock"
            />
          </up-form-item>
        </up-form>

        <view class="action-area">
          <up-button
            type="primary"
            shape="circle"
            :loading="userStore.loading"
            loadingText="登录中"
            text="登录"
            @click="handleLogin"
          />
        </view>
      </template>
    </up-card>
  </view>
</template>

<style lang="scss" scoped>
.login-page {
  padding: 32rpx;
  min-height: 100vh;
  background: #f5f5f5;
}
.login-card {
  border-radius: 24rpx;
  box-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.08);
}
.card-title {
  margin-bottom: 32rpx;
  text-align: center;
  font-weight: 600;
  font-size: 36rpx;
  color: #1aa86c;
}
.action-area {
  margin-top: 40rpx;
}
</style>
