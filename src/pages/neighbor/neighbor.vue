<script setup lang="ts" name="neighbor">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import SocialFeedContent from '../../components/SocialFeedContent.vue';
import UserStatusCard from '../../components/UserStatusCard.vue';
import { useUserStore } from '@/store/user';

/**
 * 业主圈页面 - 获取业主圈帖子
 * 从Directus获取所有type为post的业主圈帖子内容
 * 如果用户已登录，自动获取用户所在小区的帖子内容
 */

// 用户状态管理
const userStore = useUserStore();
const { loggedIn, token, userInfo } = storeToRefs(userStore);

// 基础配置
const apiBaseUrl = ref('/api');
const email = ref('molly@mail.com'); // 预设账户
const password = ref('123'); // 预设密码
const loading = ref(false);
const contentData = ref<any>(null);
const errorInfo = ref<any>(null);
// const autoLoading = ref(false); // 新增：自动加载状态
const tempCommunityId = ref(''); // 临时小区ID用于测试

// 社交动态调试相关
const debugLog = ref('=== 社交动态Props集成调试日志 ===\n');
const socialFeedPosts = ref<any[]>([]); // 传递给SocialFeedContent的数据

// 测试原始数据显示
const rawDataDisplay = ref<any>(null); // 用于显示原始API返回数据
const showRawData = ref(false); // 控制是否显示原始数据区域

// 格式化显示内容
const prettyContentData = computed(() => {
  try {
    return contentData.value ? JSON.stringify(contentData.value, null, 2) : '';
  } catch {
    return String(contentData.value || '');
  }
});

const prettyErrorInfo = computed(() => {
  try {
    return errorInfo.value ? JSON.stringify(errorInfo.value, null, 2) : '';
  } catch {
    return String(errorInfo.value || '');
  }
});

// 图片相关功能
const previewImage = ref<string>('');
const showImagePreview = ref(false);
// const imageCache = ref<Record<string, string>>({});

// 获取图片URL（带Token认证）
function getImageUrl(attachment: any): string {
  if (!token.value) {
    console.log('获取图片URL失败: 没有token');
    return '';
  }

  // 处理不同格式的attachment
  let attachmentId = '';
  if (typeof attachment === 'string') {
    attachmentId = attachment;
    console.log('图片ID（字符串）:', attachmentId);
  } else if (attachment && typeof attachment === 'object') {
    // 尝试多种可能的ID字段
    attachmentId =
      attachment.directus_files_id ||
      attachment.id ||
      attachment.file_id ||
      attachment.attachment_id ||
      '';
    console.log('图片attachment对象:', attachment);
    console.log('提取的图片ID:', attachmentId);
    console.log('可用字段:', Object.keys(attachment));
  }

  if (!attachmentId) {
    console.log('无效的attachment，无法提取ID:', attachment);
    return '';
  }

  // 生成图片URL
  const imageUrl = `${apiBaseUrl.value}/assets/${attachmentId}?access_token=${token.value}`;
  console.log('生成的图片URL:', imageUrl);
  return imageUrl;
}

// 异步获取图片数据并转换为blob URL
/* async function getImageBlob(attachment: any): Promise<string> {
  if (!token.value) {
    return '';
  }

  let attachmentId = '';
  if (typeof attachment === 'string') {
    attachmentId = attachment;
  } else if (attachment && typeof attachment === 'object') {
    // 修复：优先使用 directus_files_id 而不是 id
    attachmentId = attachment.directus_files_id || attachment.id || '';
  }

  if (!attachmentId) {
    return '';
  }

  try {
    const res: any = await uni.request({
      url: `${apiBaseUrl.value}/assets/${attachmentId}`,
      method: 'GET',
      responseType: 'arraybuffer',
      header: {
        Authorization: `Bearer ${token.value}`
      }
    });

    if (res.statusCode === 200) {
      // 将arraybuffer转换为blob URL
      const blob = new Blob([res.data], { type: 'image/jpeg' });
      return URL.createObjectURL(blob);
    }
  } catch (error) {
    console.error('获取图片失败:', error);
  }

  return '';
} */

// 预览图片
function previewImageHandler(attachment: any) {
  const imageSrc = getImageUrl(attachment);
  if (imageSrc) {
    previewImage.value = imageSrc;
    showImagePreview.value = true;
  }
}

// 关闭图片预览
function closeImagePreview() {
  showImagePreview.value = false;
  previewImage.value = '';
}

// 图片加载错误处理
function onImageError(e: any) {
  console.log('图片加载失败:', e);
  // 可以在这里设置默认图片或其他处理
}

// 获取attachment ID的辅助函数
/* function getAttachmentId(attachment: any): string {
  if (typeof attachment === 'string') {
    return attachment;
  } else if (attachment && typeof attachment === 'object') {
    return attachment.id || attachment.directus_files_id || 'unknown';
  }
  return 'unknown';
} */

// 测试图片访问权限
async function testImageAccess() {
  if (!token.value) {
    return;
  }

  loading.value = true;
  errorInfo.value = null;

  try {
    console.log(
      '开始测试图片访问，Token:',
      `${token.value.substring(0, 20)}...`
    );

    // 尝试多种访问方式
    const testMethods = [
      // 方式1: 使用Bearer Header
      {
        name: '使用Bearer Header',
        request: () =>
          uni.request({
            url: `${apiBaseUrl.value}/assets/2`,
            method: 'GET',
            header: {
              Authorization: `Bearer ${token.value}`,
              'Content-Type': 'application/json'
            }
          })
      },
      // 方式2: 使用access_token参数
      {
        name: '使用access_token参数',
        request: () =>
          uni.request({
            url: `${apiBaseUrl.value}/assets/2?access_token=${token.value}`,
            method: 'GET'
          })
      },
      // 方式3: 检查files端点
      {
        name: '检查files端点',
        request: () =>
          uni.request({
            url: `${apiBaseUrl.value}/files/2`,
            method: 'GET',
            header: {
              Authorization: `Bearer ${token.value}`,
              'Content-Type': 'application/json'
            }
          })
      }
    ];

    const results: any[] = [];
    for (const method of testMethods) {
      try {
        console.log(`测试: ${method.name}`);
        const res: any = await method.request();
        console.log(`${method.name} 结果:`, res.statusCode, res.data);
        results.push({
          method: method.name,
          status: res.statusCode,
          success: res.statusCode < 400,
          data:
            typeof res.data === 'string'
              ? res.data.substring(0, 200)
              : JSON.stringify(res.data),
          fullResponse: res.data
        });
      } catch (error) {
        console.log(`${method.name} 失败:`, error);
        results.push({
          method: method.name,
          status: 'error',
          success: false,
          error: String(error)
        });
      }
    }

    contentData.value = {
      success: true,
      testType: 'imageAccess',
      results,
      timestamp: new Date().toISOString()
    };
  } catch (e: any) {
    errorInfo.value = {
      action: 'testImageAccess',
      success: false,
      error: e?.message || String(e),
      details: e
    };
  } finally {
    loading.value = false;
  }
}

// 登录获取Token
async function login() {
  loading.value = true;
  errorInfo.value = null;

  try {
    const res: any = await uni.request({
      url: `${apiBaseUrl.value}/auth/login`,
      method: 'POST',
      data: {
        email: email.value,
        password: password.value,
        // 请求较长的token有效期，适用于移动应用
        // Directus支持通过mode参数控制token类型
        mode: 'json' // 使用JSON模式获取较长有效期的token
      },
      header: { 'Content-Type': 'application/json' }
    });

    if (res.statusCode && res.statusCode >= 400) {
      throw new Error(
        `登录失败: ${res.statusCode} - ${JSON.stringify(res.data)}`
      );
    }

    const data: any = res.data;
    const t = data?.data?.access_token || data?.access_token;

    if (t) {
      // 更新Pinia store中的token，设置2小时过期时间（移动应用标准）
      userStore.login(
        {
          id: userInfo.value.id || 'temp-user',
          first_name: userInfo.value.first_name || 'User',
          last_name: userInfo.value.last_name || '',
          email: email.value,
          community_id: userInfo.value.community_id || '',
          community_name: userInfo.value.community_name || ''
        },
        t,
        120
      ); // 2小时 = 120分钟
      uni.showToast({ title: '登录成功', icon: 'success' });
    } else {
      throw new Error('未获取到有效Token');
    }
  } catch (e: any) {
    errorInfo.value = {
      action: 'login',
      success: false,
      error: e?.message || String(e),
      details: e,
      tips: ['检查网络连接', '确认Directus服务状态', '验证账号密码']
    };
    uni.showToast({ title: '登录失败', icon: 'error' });
  } finally {
    loading.value = false;
  }
}

// 移除自动获取用户小区内容的旧逻辑

// 获取Content数据
async function getContents() {
  if (!token.value) {
    uni.showToast({ title: '请先登录获取Token', icon: 'none' });
    return;
  }

  loading.value = true;
  errorInfo.value = null;
  contentData.value = null;

  try {
    const res: any = await uni.request({
      url: `/api/items/contents`,
      method: 'GET',
      data: {
        limit: 5,
        fields:
          'id,title,body,type,attachments.*,user_created.*,author_id.id,author_id.first_name,author_id.last_name,author_id.avatar,date_created',
        filter: {
          type: { _eq: 'post' }
        }
      },
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`
      }
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      contentData.value = {
        success: true,
        total: res.data?.data?.length || 0,
        data: res.data?.data || res.data,
        requestInfo: {
          url: '/api/items/contents',
          method: 'GET',
          statusCode: res.statusCode,
          timestamp: new Date().toISOString()
        }
      };
      uni.showToast({
        title: `获取成功! ${contentData.value.total}条数据`,
        icon: 'success'
      });
    } else {
      throw new Error(
        `请求失败: ${res.statusCode} - ${JSON.stringify(res.data)}`
      );
    }
  } catch (e: any) {
    errorInfo.value = {
      action: 'getContents',
      success: false,
      error: e?.message || String(e),
      details: e,
      requestInfo: {
        url: '/api/items/contents',
        method: 'GET',
        hasToken: !!token.value,
        tokenPrefix: `${token.value?.substring(0, 10)}...`,
        timestamp: new Date().toISOString()
      },
      possibleCauses: [
        '用户没有contents集合的读取权限',
        '某些字段权限被限制',
        'Directus数据库连接问题',
        'Token过期或无效'
      ],
      tips: [
        '检查Token是否过期',
        '确认权限配置正确',
        '验证Directus服务状态',
        '检查网络连接'
      ]
    };
    uni.showToast({ title: '获取失败，查看错误信息', icon: 'error' });
  } finally {
    loading.value = false;
  }
}

// 复制内容到剪贴板
function copyContent() {
  const text = prettyContentData.value;
  if (!text) {
    uni.showToast({ title: '没有数据可复制', icon: 'none' });
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          uni.showToast({ title: '数据已复制', icon: 'success' });
        })
        .catch(() => {
          fallbackCopyTextToClipboard(text);
        });
    } else {
      fallbackCopyTextToClipboard(text);
    }
  } catch {
    uni.showToast({ title: '复制失败', icon: 'error' });
  }
}

function copyError() {
  const text = prettyErrorInfo.value;
  if (!text) {
    uni.showToast({ title: '没有错误信息可复制', icon: 'none' });
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          uni.showToast({ title: '错误信息已复制', icon: 'success' });
        })
        .catch(() => {
          fallbackCopyTextToClipboard(text);
        });
    } else {
      fallbackCopyTextToClipboard(text);
    }
  } catch {
    uni.showToast({ title: '复制失败', icon: 'error' });
  }
}

// 降级复制方法
function fallbackCopyTextToClipboard(text: string) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand('copy');
    uni.showToast({ title: '复制成功', icon: 'success' });
  } catch {
    uni.showToast({ title: '复制失败，请手动选择复制', icon: 'error' });
  }

  document.body.removeChild(textArea);
}

// 获取当前用户小区的Content数据
async function getCommunityContents() {
  if (!token.value) {
    uni.showToast({ title: '请先获取Token', icon: 'none' });
    return;
  }

  if (!userInfo.value.community_id) {
    errorInfo.value = {
      action: 'getCommunityContents',
      success: false,
      error: '用户信息中没有小区ID',
      details: userInfo.value,
      tips: ['请确保用户已正确登录', '检查用户信息是否包含community_id']
    };
    uni.showToast({ title: '用户信息中没有小区ID', icon: 'error' });
    return;
  }

  loading.value = true;
  errorInfo.value = null;
  contentData.value = null;

  try {
    const res: any = await uni.request({
      url: `/api/items/contents`,
      method: 'GET',
      data: {
        limit: 10,
        fields:
          'id,title,body,type,community_id,attachments.*,user_created.*,author_id.id,author_id.first_name,author_id.last_name,author_id.avatar,date_created',
        filter: {
          type: { _eq: 'neighbor' },
          community_id: { _eq: userInfo.value.community_id }
        }
      },
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`
      }
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      contentData.value = {
        success: true,
        total: res.data?.data?.length || 0,
        data: res.data?.data || res.data,
        requestInfo: {
          url: '/api/items/contents',
          method: 'GET',
          filter: `type=neighbor, community_id=${userInfo.value.community_id}`,
          statusCode: res.statusCode,
          timestamp: new Date().toISOString()
        }
      };
      uni.showToast({
        title: `获取成功! ${contentData.value.total}条小区数据`,
        icon: 'success'
      });
    } else {
      throw new Error(
        `请求失败: ${res.statusCode} - ${JSON.stringify(res.data)}`
      );
    }
  } catch (e: any) {
    errorInfo.value = {
      action: 'getCommunityContents',
      success: false,
      error: e?.message || String(e),
      details: e,
      requestInfo: {
        url: '/api/items/contents',
        method: 'GET',
        filter: `type=neighbor, community_id=${userInfo.value.community_id}`,
        hasToken: !!token.value,
        tokenPrefix: `${token.value?.substring(0, 10)}...`,
        timestamp: new Date().toISOString()
      },
      possibleCauses: [
        '用户没有contents集合的读取权限',
        '小区ID不存在或无效',
        '没有type为neighbor的数据',
        'Token过期或无效'
      ],
      tips: [
        '检查Token是否过期',
        '确认community_id是否正确',
        '验证Directus服务状态',
        '检查网络连接'
      ]
    };
    uni.showToast({ title: '获取失败，查看错误信息', icon: 'error' });
  } finally {
    loading.value = false;
  }
}

// 测试方法1: type=neighbor + community_id过滤（与getCommunityContents相同）
async function testMethod1() {
  return getCommunityContents();
}

// 测试方法2: 只使用type=neighbor，不过滤小区
async function testMethod2() {
  if (!token.value) {
    uni.showToast({ title: '请先获取Token', icon: 'none' });
    return;
  }

  loading.value = true;
  errorInfo.value = null;
  contentData.value = null;

  try {
    const res: any = await uni.request({
      url: `/api/items/contents`,
      method: 'GET',
      data: {
        limit: 10,
        fields:
          'id,title,body,type,community_id,attachments.*,user_created.*,author_id.id,author_id.first_name,author_id.last_name,author_id.avatar,date_created',
        filter: {
          type: { _eq: 'neighbor' }
        }
      },
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`
      }
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      contentData.value = {
        success: true,
        total: res.data?.data?.length || 0,
        data: res.data?.data || res.data,
        testMethod: '测试方法2: 只邻居类型',
        requestInfo: {
          url: '/api/items/contents',
          method: 'GET',
          filter: 'type=neighbor (所有小区)',
          statusCode: res.statusCode,
          timestamp: new Date().toISOString()
        }
      };
      uni.showToast({
        title: `测试2成功! ${contentData.value.total}条邻居数据`,
        icon: 'success'
      });
    } else {
      throw new Error(
        `请求失败: ${res.statusCode} - ${JSON.stringify(res.data)}`
      );
    }
  } catch (e: any) {
    errorInfo.value = {
      action: 'testMethod2',
      success: false,
      error: e?.message || String(e),
      details: e,
      testMethod: '测试方法2: 只邻居类型',
      tips: ['检查是否有type为neighbor的数据', '确认权限配置正确']
    };
    uni.showToast({ title: '测试2失败', icon: 'error' });
  } finally {
    loading.value = false;
  }
}

// 测试方法3: type=post + community_id过滤
async function testMethod3() {
  if (!token.value) {
    uni.showToast({ title: '请先获取Token', icon: 'none' });
    return;
  }

  if (!userInfo.value.community_id) {
    errorInfo.value = {
      action: 'testMethod3',
      success: false,
      error: '用户信息中没有小区ID',
      testMethod: '测试方法3: 帖子+小区',
      details: userInfo.value
    };
    uni.showToast({ title: '用户信息中没有小区ID', icon: 'error' });
    return;
  }

  loading.value = true;
  errorInfo.value = null;
  contentData.value = null;

  try {
    const res: any = await uni.request({
      url: `/api/items/contents`,
      method: 'GET',
      data: {
        limit: 10,
        fields:
          'id,title,body,type,community_id,attachments.*,user_created.*,author_id.id,author_id.first_name,author_id.last_name,author_id.avatar,date_created',
        filter: {
          type: { _eq: 'post' },
          community_id: { _eq: userInfo.value.community_id }
        }
      },
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`
      }
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      contentData.value = {
        success: true,
        total: res.data?.data?.length || 0,
        data: res.data?.data || res.data,
        testMethod: '测试方法3: 帖子+小区',
        requestInfo: {
          url: '/api/items/contents',
          method: 'GET',
          filter: `type=post, community_id=${userInfo.value.community_id}`,
          statusCode: res.statusCode,
          timestamp: new Date().toISOString()
        }
      };
      uni.showToast({
        title: `测试3成功! ${contentData.value.total}条小区帖子`,
        icon: 'success'
      });
    } else {
      throw new Error(
        `请求失败: ${res.statusCode} - ${JSON.stringify(res.data)}`
      );
    }
  } catch (e: any) {
    errorInfo.value = {
      action: 'testMethod3',
      success: false,
      error: e?.message || String(e),
      details: e,
      testMethod: '测试方法3: 帖子+小区',
      tips: ['检查是否有type为post的数据', '确认小区ID是否正确']
    };
    uni.showToast({ title: '测试3失败', icon: 'error' });
  } finally {
    loading.value = false;
  }
}

// 测试方法4: 无过滤条件，获取所有内容
async function testMethod4() {
  if (!token.value) {
    uni.showToast({ title: '请先获取Token', icon: 'none' });
    return;
  }

  loading.value = true;
  errorInfo.value = null;
  contentData.value = null;

  try {
    const res: any = await uni.request({
      url: `/api/items/contents`,
      method: 'GET',
      data: {
        limit: 10,
        fields: 'id,title,body,type,community_id,attachments.*'
      },
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`
      }
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      contentData.value = {
        success: true,
        total: res.data?.data?.length || 0,
        data: res.data?.data || res.data,
        testMethod: '测试方法4: 无过滤',
        requestInfo: {
          url: '/api/items/contents',
          method: 'GET',
          filter: '无过滤条件 (所有内容)',
          statusCode: res.statusCode,
          timestamp: new Date().toISOString()
        }
      };
      uni.showToast({
        title: `测试4成功! ${contentData.value.total}条所有数据`,
        icon: 'success'
      });
    } else {
      throw new Error(
        `请求失败: ${res.statusCode} - ${JSON.stringify(res.data)}`
      );
    }
  } catch (e: any) {
    errorInfo.value = {
      action: 'testMethod4',
      success: false,
      error: e?.message || String(e),
      details: e,
      testMethod: '测试方法4: 无过滤',
      tips: ['检查contents集合是否有数据', '确认权限配置正确']
    };
    uni.showToast({ title: '测试4失败', icon: 'error' });
  } finally {
    loading.value = false;
  }
}

// 检查用户信息和Token详情
async function checkUserInfo() {
  if (!token.value) {
    uni.showToast({ title: '请先获取Token', icon: 'none' });
    return;
  }

  loading.value = true;
  errorInfo.value = null;

  try {
    // 获取详细的用户信息
    const userRes: any = await uni.request({
      url: `${apiBaseUrl.value}/users/me`,
      method: 'GET',
      header: {
        Authorization: `Bearer ${token.value}`,
        'Content-Type': 'application/json'
      }
    });

    if (userRes.statusCode >= 200 && userRes.statusCode < 300) {
      const userData = userRes.data?.data || userRes.data;

      contentData.value = {
        success: true,
        testMethod: '检查用户信息',
        userInfoFromAPI: userData,
        userInfoFromStore: userInfo.value,
        tokenInfo: {
          storeToken: token.value ? `${token.value.substring(0, 20)}...` : '无'
        },
        availableFields: Object.keys(userData || {}),
        tips: [
          '检查API返回的用户数据中是否有community相关字段',
          '可能的字段名: community_id, community, community_name, 等'
        ]
      };

      uni.showToast({ title: '用户信息获取成功', icon: 'success' });
    } else {
      throw new Error(
        `获取用户信息失败: ${userRes.statusCode} - ${JSON.stringify(
          userRes.data
        )}`
      );
    }
  } catch (e: any) {
    errorInfo.value = {
      action: 'checkUserInfo',
      success: false,
      error: e?.message || String(e),
      details: e,
      currentUserInfo: userInfo.value,
      tips: ['检查Token是否有效', '确认网络连接正常']
    };
    uni.showToast({ title: '检查用户信息失败', icon: 'error' });
  } finally {
    loading.value = false;
  }
}

// 测试方法5: 获取社区列表，帮助了解有哪些小区
async function testMethod5() {
  if (!token.value) {
    uni.showToast({ title: '请先获取Token', icon: 'none' });
    return;
  }

  loading.value = true;
  errorInfo.value = null;
  contentData.value = null;

  try {
    const res: any = await uni.request({
      url: `/api/items/communities`,
      method: 'GET',
      data: {
        limit: 20,
        fields: 'id,name'
      },
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`
      }
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      contentData.value = {
        success: true,
        total: res.data?.data?.length || 0,
        data: res.data?.data || res.data,
        testMethod: '测试方法5: 获取小区列表',
        requestInfo: {
          url: '/api/items/communities',
          method: 'GET',
          filter: '获取所有社区信息',
          statusCode: res.statusCode,
          timestamp: new Date().toISOString()
        },
        tips: [
          '这里显示系统中所有的小区',
          '可以从中选择一个community_id进行测试',
          '复制某个小区的ID，手动设置到用户信息中测试'
        ]
      };
      uni.showToast({
        title: `获取到${contentData.value.total}个小区`,
        icon: 'success'
      });
    } else {
      throw new Error(
        `请求失败: ${res.statusCode} - ${JSON.stringify(res.data)}`
      );
    }
  } catch (e: any) {
    errorInfo.value = {
      action: 'testMethod5',
      success: false,
      error: e?.message || String(e),
      details: e,
      testMethod: '测试方法5: 获取小区列表',
      tips: ['检查是否有communities集合', '确认权限配置正确']
    };
    uni.showToast({ title: '获取小区列表失败', icon: 'error' });
  } finally {
    loading.value = false;
  }
}

// 使用临时小区ID进行测试
async function testWithTempId() {
  if (!token.value) {
    uni.showToast({ title: '请先获取Token', icon: 'none' });
    return;
  }

  if (!tempCommunityId.value) {
    uni.showToast({ title: '请输入临时小区ID', icon: 'none' });
    return;
  }

  loading.value = true;
  errorInfo.value = null;
  contentData.value = null;

  try {
    const res: any = await uni.request({
      url: `/api/items/contents`,
      method: 'GET',
      data: {
        limit: 10,
        fields:
          'id,title,body,type,community_id,attachments.*,user_created.*,author_id.id,author_id.first_name,author_id.last_name,author_id.avatar,date_created',
        filter: {
          type: { _eq: 'neighbor' },
          community_id: { _eq: tempCommunityId.value }
        }
      },
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`
      }
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      contentData.value = {
        success: true,
        total: res.data?.data?.length || 0,
        data: res.data?.data || res.data,
        testMethod: `临时测试: 小区ID ${tempCommunityId.value}`,
        requestInfo: {
          url: '/api/items/contents',
          method: 'GET',
          filter: `type=neighbor, community_id=${tempCommunityId.value}`,
          statusCode: res.statusCode,
          timestamp: new Date().toISOString()
        }
      };
      uni.showToast({
        title: `临时测试成功! ${contentData.value.total}条数据`,
        icon: 'success'
      });
    } else {
      throw new Error(
        `请求失败: ${res.statusCode} - ${JSON.stringify(res.data)}`
      );
    }
  } catch (e: any) {
    errorInfo.value = {
      action: 'testWithTempId',
      success: false,
      error: e?.message || String(e),
      details: e,
      testCommunityId: tempCommunityId.value,
      tips: [
        `检查小区ID ${tempCommunityId.value} 是否存在`,
        '确认该小区是否有neighbor类型的内容',
        '尝试先用"测试5"获取可用的小区列表'
      ]
    };
    uni.showToast({ title: '临时测试失败', icon: 'error' });
  } finally {
    loading.value = false;
  }
}

// 数据转换函数：将Directus content数据转换为社交动态格式
function transformContentToSocialPosts(rawContentData: any) {
  addDebugLog('开始转换content数据为社交动态格式...');

  if (!rawContentData?.data || !Array.isArray(rawContentData.data)) {
    addDebugLog('❌ 无效的content数据结构');
    return [];
  }

  const transformedPosts = rawContentData.data.map(
    (item: any, index: number) => {
      addDebugLog(`转换第${index + 1}条数据: ${item.title || 'Untitled'}`);

      // 格式化时间
      const formatTime = (dateStr: string) => {
        if (!dateStr) return '刚刚';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return '刚刚';
        if (diffMins < 60) return `${diffMins}分钟前`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前`;
        return `${Math.floor(diffMins / 1440)}天前`;
      };

      // 确定内容类型
      const hasImages =
        item.attachments &&
        Array.isArray(item.attachments) &&
        item.attachments.length > 0;
      const contentType = hasImages ? 'image' : 'text';

      // 转换图片附件
      let images: string[] = [];
      if (hasImages) {
        addDebugLog(`处理图片附件: ${item.attachments.length}张图片`);
        images = item.attachments
          .map((att: any, imgIndex: number) => {
            // 根据实际数据结构，使用directus_files_id
            const fileId = att.directus_files_id || att.id || att;
            const url = getImageUrl(fileId);
            addDebugLog(
              `图片${imgIndex + 1}: ${
                url ? 'URL生成成功' : '无法生成URL'
              } - fileId: ${fileId} - 原始数据: ${JSON.stringify(att)}`
            );
            return url;
          })
          .filter((url: string) => url);
        addDebugLog(`最终图片URLs: ${images.length}个有效URL`);
      }

      // 获取用户名称和头像
      const getUserInfo = () => {
        // 打印当前item的结构用于调试
        addDebugLog(`用户信息调试 - item ${index + 1}:`);
        addDebugLog(`- 完整字段: ${Object.keys(item).join(', ')}`);
        addDebugLog(`- author_id: ${JSON.stringify(item.author_id)}`);
        addDebugLog(`- user_created: ${JSON.stringify(item.user_created)}`);

        // 最优先：使用关联查询的author_id信息
        if (item.author_id && typeof item.author_id === 'object') {
          // 优化用户名组合：优先使用first_name，如果有last_name则组合
          let authorName = '';
          if (item.author_id.first_name && item.author_id.last_name) {
            authorName = `${item.author_id.first_name} ${item.author_id.last_name}`;
          } else if (item.author_id.first_name) {
            authorName = item.author_id.first_name;
          } else if (item.author_id.last_name) {
            authorName = item.author_id.last_name;
          } else {
            authorName = '业主用户';
          }
          
          // 处理头像URL，如果avatar是文件ID则转换为完整URL
          let authorAvatar = '';
          if (item.author_id.avatar) {
            authorAvatar = getImageUrl(item.author_id.avatar);
            addDebugLog(`头像URL: ${authorAvatar}`);
          }
          addDebugLog(`✓ 使用author_id关联数据: ${authorName}`);
          return {
            name: authorName,
            avatar: authorAvatar,
            title: `${item.community_name || '社区'}业主`
          };
        }

        // 其次：使用user_created（Directus系统字段）
        if (item.user_created && typeof item.user_created === 'object') {
          const userName =
            item.user_created.first_name ||
            item.user_created.name ||
            item.user_created.email;
          if (userName) {
            // 处理头像URL
            let userAvatar = '';
            if (item.user_created.avatar) {
              userAvatar = getImageUrl(item.user_created.avatar);
              addDebugLog(`用户头像URL: ${userAvatar}`);
            }
            addDebugLog(`✓ 使用user_created: ${userName}`);
            return {
              name: userName,
              avatar: userAvatar,
              title: `${item.community_name || '社区'}业主`
            };
          }
        } else if (typeof item.user_created === 'string') {
          addDebugLog(`✓ 使用user_created (字符串): ${item.user_created}`);
          return {
            name: item.user_created,
            avatar: '',
            title: `${item.community_name || '社区'}业主`
          };
        }

        // 尝试其他可能的字段
        if (item.author_name) {
          addDebugLog(`✓ 使用author_name: ${item.author_name}`);
          return {
            name: item.author_name,
            avatar: '',
            title: `${item.community_name || '社区'}业主`
          };
        }

        // 默认显示
        addDebugLog('⚠️ 使用默认用户信息');
        return {
          name: '社区用户',
          avatar: '',
          title: `${item.community_name || '社区'}业主`
        };
      };

      // 获取用户信息
      const userInfo = getUserInfo();

      // 构建社交动态数据格式
      const socialPost = {
        id: item.id || `content-${index}`,
        user: {
          name: userInfo.name,
          title: userInfo.title,
          avatar: userInfo.avatar, // 现在支持头像了
          time: formatTime(item.date_created)
        },
        content: `${item.title || ''}\n\n${item.body || ''}`.trim(),
        likes: '0', // 后续可以扩展点赞功能
        comments: '0', // 后续可以扩展评论功能
        type: contentType,
        images
      };

      addDebugLog(`✓ 转换完成: ${socialPost.user.name} - ${contentType}类型`);
      return socialPost;
    }
  );

  addDebugLog(`🎉 数据转换完成，共${transformedPosts.length}条动态`);
  return transformedPosts;
}

// 测试真实数据转换
function testRealDataTransform() {
  addDebugLog('开始测试真实数据转换...');

  if (!contentData.value || !contentData.value.success) {
    addDebugLog('❌ 没有可用的content数据，请先获取content数据');
    uni.showToast({ title: '请先获取content数据', icon: 'none' });
    return;
  }

  try {
    // 转换真实数据
    const transformedPosts = transformContentToSocialPosts(contentData.value);

    if (transformedPosts.length === 0) {
      addDebugLog('⚠️ 转换结果为空，可能content数据格式不符合预期');
      uni.showToast({ title: '转换结果为空', icon: 'none' });
      return;
    }

    // 设置转换后的数据
    socialFeedPosts.value = transformedPosts;
    addDebugLog(
      `✅ 真实数据转换完成，已设置${transformedPosts.length}条社交动态`
    );
    addDebugLog(`示例数据: ${JSON.stringify(transformedPosts[0], null, 2)}`);

    uni.showToast({
      title: `转换成功！${transformedPosts.length}条动态`,
      icon: 'success'
    });
  } catch (error) {
    addDebugLog(`❌ 数据转换发生错误: ${error}`);
    uni.showToast({ title: '数据转换失败', icon: 'error' });
  }
}

// 社交动态调试相关函数
function addDebugLog(message: string) {
  const timestamp = new Date().toLocaleTimeString();
  debugLog.value += `[${timestamp}] ${message}\n`;
}

function clearDebugLog() {
  debugLog.value = '=== 社交动态Props集成调试日志 ===\n';
  addDebugLog('日志已清空');
}

function copyDebugLog() {
  const text = debugLog.value;
  if (!text) {
    uni.showToast({ title: '没有日志可复制', icon: 'none' });
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          uni.showToast({ title: '调试日志已复制', icon: 'success' });
        })
        .catch(() => {
          fallbackCopyTextToClipboard(text);
        });
    } else {
      fallbackCopyTextToClipboard(text);
    }
  } catch {
    uni.showToast({ title: '复制失败', icon: 'error' });
  }
}

// 测试Props集成
function testPropsIntegration() {
  addDebugLog('开始测试Props集成...');

  // 创建测试数据
  const testPosts = [
    {
      id: 'test-1',
      user: {
        name: '测试用户1',
        title: '业主 | 测试小区',
        avatar: '',
        time: '刚刚'
      },
      content: '这是一条测试动态，用于验证Props集成是否正常工作 🚀',
      likes: '0',
      comments: '0',
      type: 'text'
    },
    {
      id: 'test-2',
      user: {
        name: '测试用户2',
        title: '业主 | 测试小区',
        avatar: '',
        time: '1分钟前'
      },
      content: '这是第二条测试动态，包含图片展示功能测试 📷',
      likes: '5',
      comments: '2',
      type: 'image',
      images: ['test1.jpg', 'test2.jpg']
    }
  ];

  // 设置测试数据
  socialFeedPosts.value = testPosts;
  addDebugLog(`已设置测试数据，包含 ${testPosts.length} 条动态`);
  addDebugLog(`测试数据结构: ${JSON.stringify(testPosts[0], null, 2)}`);
  addDebugLog('Props集成测试完成！请查看下方社交动态区域');

  uni.showToast({ title: '测试数据已设置', icon: 'success' });
}

// 测试原始数据获取 - 专门用于查看API返回的完整数据结构
async function testRawDataFetch() {
  if (!token.value) {
    uni.showToast({ title: '请先获取Token', icon: 'none' });
    return;
  }

  loading.value = true;
  errorInfo.value = null;
  rawDataDisplay.value = null;

  try {
    addDebugLog('开始获取原始API数据...');
    
    // 测试1: 获取邻居类型数据（包含关联查询）
    const neighborRes: any = await uni.request({
      url: `/api/items/posts`,
      method: 'GET', 
      data: {
        limit: 3,
        fields: 'id,title,body,type,community_id,attachments.*,user_created.*,author_id.id,author_id.first_name,author_id.last_name,author_id.avatar,date_created',
        filter: {
          type: { _eq: 'neighbor' }
        }
      },
      header: {
        'Content-Type': 'application/json',
        // Authorization: `Bearer ${token.value}`
        Authorization: `Bearer sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n`
      }
    });

    // 测试2: 获取post类型数据
    const postRes: any = await uni.request({
      url: `/api/items/posts`,
      method: 'GET',
      data: {
        limit: 3,
        fields: 'id,title,body,type,community_id,attachments.*,user_created.*,author_id.id,author_id.first_name,author_id.last_name,author_id.avatar,date_created',
        filter: {
          type: { _eq: 'post' }
        }
      },
      header: {
        'Content-Type': 'application/json',
        // Authorization: `Bearer ${token.value}`
        Authorization: `Bearer sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n`
      }
    });

    // 测试3: 获取所有数据（无过滤）
    const allRes: any = await uni.request({
      url: `/api/items/posts`,
      method: 'GET',
      data: {
        limit: 5,
        fields: 'id,title,body,type,community_id,attachments.*,user_created.*,author_id.id,author_id.first_name,author_id.last_name,author_id.avatar,date_created'
      },
      header: {
        'Content-Type': 'application/json', 
        // Authorization: `Bearer ${token.value}`
        Authorization: `Bearer sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n`
      }
    });

    rawDataDisplay.value = {
      timestamp: new Date().toISOString(),
      tests: {
        neighborData: {
          status: neighborRes.statusCode,
          data: neighborRes.data,
          count: neighborRes.data?.data?.length || 0
        },
        postData: {
          status: postRes.statusCode,
          data: postRes.data,
          count: postRes.data?.data?.length || 0
        },
        allData: {
          status: allRes.statusCode,
          data: allRes.data,
          count: allRes.data?.data?.length || 0
        }
      },
      summary: {
        totalNeighbor: neighborRes.data?.data?.length || 0,
        totalPost: postRes.data?.data?.length || 0,
        totalAll: allRes.data?.data?.length || 0
      }
    };
    
    showRawData.value = true;
    addDebugLog(`✅ 原始数据获取完成：邻居${rawDataDisplay.value.summary.totalNeighbor}条，帖子${rawDataDisplay.value.summary.totalPost}条，全部${rawDataDisplay.value.summary.totalAll}条`);
    
    uni.showToast({ 
      title: '原始数据获取成功！请查看原始数据区域', 
      icon: 'success' 
    });

  } catch (e: any) {
    errorInfo.value = {
      action: 'testRawDataFetch',
      success: false,
      error: e?.message || String(e),
      details: e
    };
    addDebugLog(`❌ 原始数据获取失败: ${e?.message || String(e)}`);
    uni.showToast({ title: '获取原始数据失败', icon: 'error' });
  } finally {
    loading.value = false;
  }
}

// 复制原始数据
function copyRawData() {
  if (!rawDataDisplay.value) {
    uni.showToast({ title: '没有原始数据可复制', icon: 'none' });
    return;
  }

  const text = JSON.stringify(rawDataDisplay.value, null, 2);
  try {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          uni.showToast({ title: '原始数据已复制', icon: 'success' });
        })
        .catch(() => {
          fallbackCopyTextToClipboard(text);
        });
    } else {
      fallbackCopyTextToClipboard(text);
    }
  } catch {
    uni.showToast({ title: '复制失败', icon: 'error' });
  }
}

// 测试post数据转换（基于已获取的原始数据）
function testPostDataTransform() {
  addDebugLog('开始测试post数据转换...');
  
  if (!rawDataDisplay.value || !rawDataDisplay.value.tests.postData.data.data) {
    addDebugLog('❌ 没有可用的post原始数据，请先点击"获取原始数据"');
    uni.showToast({ title: '请先获取原始数据', icon: 'none' });
    return;
  }
  
  try {
    // 使用post数据进行转换
    const postData = {
      success: true,
      data: rawDataDisplay.value.tests.postData.data.data
    };
    
    const transformedPosts = transformContentToSocialPosts(postData);
    
    if (transformedPosts.length === 0) {
      addDebugLog('⚠️ post数据转换结果为空');
      uni.showToast({ title: 'post数据转换结果为空', icon: 'none' });
      return;
    }
    
    // 设置转换后的数据
    socialFeedPosts.value = transformedPosts;
    addDebugLog(`✅ post数据转换完成，已设置${transformedPosts.length}条社交动态`);
    addDebugLog('转换结果预览:');
    transformedPosts.forEach((post, index) => {
      addDebugLog(`${index + 1}. ${post.user.name} - ${post.type}类型 - 图片${post.images?.length || 0}张`);
    });
    
    uni.showToast({ 
      title: `post数据转换成功！${transformedPosts.length}条动态`, 
      icon: 'success' 
    });
    
  } catch (error) {
    addDebugLog(`❌ post数据转换发生错误: ${error}`);
    uni.showToast({ title: 'post数据转换失败', icon: 'error' });
  }
}

// 移除页面加载时的自动状态检查逻辑
// onMounted(() => {
//   // 暂时移除自动获取逻辑，等待新的状态方案实施
// });
</script>

<template>
  <view class="page-container">
    <!-- 页面标题 -->
    <view class="header">
      <text class="title">业主圈</text>
      <text class="subtitle">获取业主圈帖子数据</text>
    </view>

    <!-- 用户登录状态显示 -->
    <UserStatusCard theme="wechat" />

    <!-- 用户登录后的操作区域 -->
    <view v-if="loggedIn" class="section">
      <view class="result-header">
        <text class="section-title">🔑 Token状态</text>
        <text class="token-status" :class="{ 'has-token': token }">
          {{
            token
              ? `Token已获取 (${token.substring(0, 15)}...)`
              : '需要获取Token'
          }}
        </text>
      </view>

      <view v-if="token" class="buttons">
        <button
          class="btn-primary"
          :loading="loading"
          :disabled="loading"
          @click="getCommunityContents"
        >
          获取当前小区内容
        </button>
      </view>

      <!-- 临时测试区域 -->
      <view v-if="token && !userInfo.community_id" class="temp-test-section">
        <text class="temp-title">⚠️ 临时测试（用户无小区ID）</text>
        <view class="temp-input-row">
          <text class="temp-label">临时小区ID:</text>
          <input
            v-model="tempCommunityId"
            class="temp-input"
            placeholder="输入小区ID测试"
          />
          <button
            class="btn-temp"
            :disabled="!tempCommunityId"
            @click="testWithTempId"
          >
            测试
          </button>
        </view>
      </view>

      <!-- 测试按钮区域 -->
      <view v-if="token" class="test-buttons-section">
        <text class="test-title">🧪 测试不同请求方式</text>
        <view class="test-buttons">
          <button
            class="btn-test"
            :loading="loading"
            :disabled="loading"
            @click="testMethod1"
          >
            测试1: 邻居+小区
          </button>
          <button
            class="btn-test"
            :loading="loading"
            :disabled="loading"
            @click="testMethod2"
          >
            测试2: 只邻居类型
          </button>
          <button
            class="btn-test"
            :loading="loading"
            :disabled="loading"
            @click="testMethod3"
          >
            测试3: 帖子+小区
          </button>
          <button
            class="btn-test"
            :loading="loading"
            :disabled="loading"
            @click="testMethod4"
          >
            测试4: 无过滤
          </button>
          <button
            class="btn-test"
            :loading="loading"
            :disabled="loading"
            @click="checkUserInfo"
          >
            检查用户信息
          </button>
          <button
            class="btn-test"
            :loading="loading"
            :disabled="loading"
            @click="testMethod5"
          >
            测试5: 获取小区列表
          </button>
        </view>
      </view>
    </view>

    <!-- 操作区域 - 已登录时隐藏 -->
    <view v-if="!loggedIn" class="section">
      <view class="account-info">
        <text class="label">预设账户: {{ email }}</text>
        <text class="token-status" :class="{ 'has-token': token }">
          {{ token ? 'Token已获取' : '未登录' }}
        </text>
      </view>

      <view class="buttons">
        <button
          class="btn-primary"
          :loading="loading"
          :disabled="loading"
          @click="login"
        >
          {{ loading ? '登录中...' : '获取Token' }}
        </button>
      </view>

      <view v-if="token" class="buttons">
        <button
          class="btn-default"
          :loading="loading"
          :disabled="loading"
          @click="getContents"
        >
          获取业主圈帖子
        </button>
      </view>

      <view v-if="token" class="buttons">
        <button
          class="btn-warn"
          :loading="loading"
          :disabled="loading"
          @click="testImageAccess"
        >
          测试图片访问
        </button>
      </view>
    </view>

    <!-- 成功数据展示 - 现在以卡片形式展示 -->
    <view v-if="contentData && contentData.success" class="section">
      <view class="result-header">
        <text class="section-title"
          >📊 业主动态 ({{ contentData.total }}条)</text
        >
        <button size="mini" class="btn-primary" @click="copyContent">
          复制数据
        </button>
      </view>

      <!-- 内容卡片展示 -->
      <view class="content-list">
        <view
          v-for="item in contentData.data"
          :key="item.id"
          class="content-card"
        >
          <view class="card-header">
            <text class="post-title">{{ item.title || '无标题' }}</text>
            <text class="post-type">{{ item.type }}</text>
          </view>
          <view class="card-body">
            <text class="post-content">{{ item.body || '无内容' }}</text>

            <!-- 图片提示信息 -->
            <!-- 实际图片显示 -->
            <view
              v-if="item.attachments && item.attachments.length > 0"
              class="image-gallery"
            >
              <text class="gallery-title"
                >📷 图片 ({{ item.attachments.length }})</text
              >
              <view class="image-grid">
                <view
                  v-for="(attachment, index) in item.attachments.slice(0, 4)"
                  :key="index"
                  class="image-item"
                  @click="previewImageHandler(attachment)"
                >
                  <image
                    :src="getImageUrl(attachment)"
                    class="post-image"
                    mode="aspectFill"
                    :lazy-load="true"
                    @error="onImageError"
                  />
                  <!-- 如果超过4张图片，显示+N -->
                  <view
                    v-if="index === 3 && item.attachments.length > 4"
                    class="more-images-overlay"
                  >
                    <text class="more-text"
                      >+{{ item.attachments.length - 4 }}</text
                    >
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 错误信息展示 -->
    <view v-if="errorInfo" class="section">
      <view class="result-header">
        <text class="section-title">❌ 错误信息</text>
        <button size="mini" class="btn-warn" @click="copyError">
          复制错误
        </button>
      </view>
      <scroll-view class="data-box error-box" scroll-y>
        <text selectable>{{ prettyErrorInfo }}</text>
      </scroll-view>
    </view>

    <!-- 占位提示 -->
    <view v-if="!contentData && !errorInfo" class="section">
      <view class="placeholder">
        <text class="placeholder-text">📱 点击上方按钮开始获取数据</text>
        <text class="placeholder-desc">
          🏠 这里将展示业主圈发布的帖子内容
        </text>
      </view>
    </view>

    <!-- 图片预览弹窗 -->
    <view
      v-if="showImagePreview"
      class="image-preview-modal"
      @click="closeImagePreview"
    >
      <image :src="previewImage" class="preview-image" mode="aspectFit" />
      <view class="close-btn" @click="closeImagePreview">
        <text class="close-icon">✕</text>
      </view>
    </view>

    <!-- 社交动态调试区域 -->
    <view class="section">
      <view class="result-header">
        <text class="section-title">🔧 社交动态调试</text>
        <button size="mini" class="btn-warn" @click="copyDebugLog">
          复制日志
        </button>
      </view>
      <scroll-view class="debug-log-box" scroll-y>
        <text selectable>{{ debugLog }}</text>
      </scroll-view>

      <view class="debug-buttons">
        <button class="btn-debug" @click="testPropsIntegration">
          测试Props集成
        </button>
        <button class="btn-debug" @click="testRealDataTransform">
          转换真实数据
        </button>
        <button class="btn-debug" @click="testRawDataFetch">
          获取原始数据
        </button>
        <button class="btn-debug" @click="testPostDataTransform">
          转换POST数据
        </button>
        <button class="btn-debug" @click="clearDebugLog">清空日志</button>
      </view>
    </view>

    <!-- 原始数据测试区域 -->
    <view v-if="showRawData && rawDataDisplay" class="section">
      <view class="result-header">
        <text class="section-title">📋 原始API数据测试</text>
        <button size="mini" class="btn-primary" @click="copyRawData">
          复制原始数据
        </button>
      </view>
      
      <view class="raw-data-summary">
        <text class="summary-text">
          📊 数据统计: 邻居类型{{ rawDataDisplay.summary.totalNeighbor }}条 | 
          帖子类型{{ rawDataDisplay.summary.totalPost }}条 | 
          全部{{ rawDataDisplay.summary.totalAll }}条
        </text>
        <text class="summary-time">获取时间: {{ new Date(rawDataDisplay.timestamp).toLocaleString() }}</text>
      </view>
      
      <scroll-view class="raw-data-box" scroll-y>
        <text selectable>{{ JSON.stringify(rawDataDisplay, null, 2) }}</text>
      </scroll-view>
      
      <view class="raw-data-actions">
        <button class="btn-debug" @click="showRawData = false">
          隐藏原始数据
        </button>
        <button class="btn-debug" @click="testRawDataFetch">
          重新获取
        </button>
      </view>
    </view>

    <!-- 社交动态区域 -->
    <view class="section">
      <view class="result-header">
        <text class="section-title">🌟 社交动态</text>
        <text class="section-desc">社区用户最新动态</text>
      </view>
      <SocialFeedContent :external-posts="socialFeedPosts" />
    </view>
  </view>
</template>

<style scoped>
.page-container {
  padding: 12px;
  padding-bottom: 70px; /* 为底部TabBar留出空间 */
  min-height: 100vh;
  background-color: #f5f5f5;
  font-size: 14px;
}
/* 页面标题 */
.header {
  margin-bottom: 20px;
  text-align: center;
}
.title {
  display: block;
  margin-bottom: 6px;
  font-weight: bold;
  font-size: 24px;
  color: #333;
}
.subtitle {
  display: block;
  font-size: 14px;
  color: #666;
}
/* 通用区块 */
.section {
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
/* 账户信息 */
.account-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  background: #f8f9fa;
}
.label {
  font-size: 14px;
  color: #555;
}
.token-status {
  padding: 2px 8px;
  border-radius: 12px;
  background: #eee;
  font-size: 12px;
  color: #999;
}
.token-status.has-token {
  background: #e8f5e8;
  color: #07c160;
}
/* 按钮区域 */
.buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.buttons button {
  flex: 1;
}
/* 按钮样式 */
.btn-primary {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background-color: #007aff;
  color: white;
}
.btn-default {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background-color: #6c757d;
  color: white;
}
.btn-warn {
  padding: 4px 8px;
  border: none;
  border-radius: 6px;
  background-color: #dc3545;
  color: white;
}
/* 结果区域标题 */
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.section-title {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}
.section-desc {
  margin-left: 8px;
  font-size: 12px;
  color: #999;
}
/* 内容卡片列表 */
.content-list {
  margin-top: 16px;
}
.content-card {
  margin-bottom: 12px;
  padding: 12px;
  border-left: 4px solid #007aff;
  border-radius: 8px;
  background: #f8f9fa;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.post-title {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}
.post-type {
  padding: 2px 8px;
  border-radius: 12px;
  background: #007aff;
  font-size: 12px;
  color: white;
}
.card-body {
  margin-top: 8px;
}
.post-content {
  line-height: 1.5;
  font-size: 14px;
  color: #666;
}
/* 数据展示框 */
.data-box {
  padding: 12px;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  height: 300px;
  line-height: 1.4;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  white-space: pre-wrap;
}
.error-box {
  border-color: #fecaca;
  background: #fef2f2;
  color: #dc2626;
}
/* 图片展示 */
.image-gallery {
  margin-top: 12px;
}
.gallery-title {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}
/* 图片占位符 */
.image-placeholder {
  margin-bottom: 12px;
  padding: 20px;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  background: #f8f9fa;
  text-align: center;
}
.placeholder-icon {
  display: block;
  margin-bottom: 8px;
  font-size: 24px;
}
.placeholder-title {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  font-size: 14px;
  color: #333;
}
.placeholder-desc {
  display: block;
  font-size: 12px;
  color: #666;
}
/* 附件列表 */
.attachment-list {
  margin-top: 8px;
}
.attachment-item {
  margin-bottom: 4px;
  padding: 6px 10px;
  border-radius: 4px;
  background: #e9ecef;
}
.attachment-text {
  font-size: 12px;
  color: #495057;
}
.debug-info {
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 4px;
  background: #f0f0f0;
  font-size: 11px;
}
.debug-text {
  color: #666;
  word-break: break-all;
}
.image-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.image-item {
  overflow: hidden;
  position: relative;
  border-radius: 8px;
  cursor: pointer;
  aspect-ratio: 1;
}
.post-image {
  border-radius: 8px;
  width: 100%;
  height: 100%;
  transition: transform 0.2s ease;
}
.image-item:active .post-image {
  transform: scale(0.95);
}
.more-images-overlay {
  display: flex;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.6);
}
.more-text {
  font-weight: bold;
  font-size: 16px;
  color: white;
}
/* 图片预览弹窗 */
.image-preview-modal {
  display: flex;
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 1000;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.9);
}
.preview-image {
  max-width: 90vw;
  max-height: 90vh;
}
.close-btn {
  display: flex;
  position: absolute;
  right: 20px;
  top: 40px;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}
.close-icon {
  font-weight: bold;
  font-size: 18px;
  color: white;
}
/* 占位内容 */
.placeholder {
  padding: 40px 20px;
  text-align: center;
}
.placeholder-text {
  display: block;
  margin-bottom: 16px;
  font-weight: 500;
  font-size: 16px;
  color: #666;
}
.placeholder-desc {
  display: block;
  line-height: 1.6;
  font-size: 14px;
  color: #999;
}
/* 临时测试区域 */
.temp-test-section {
  margin-top: 16px;
  padding: 12px;
  border: 1px dashed #ff9500;
  border-radius: 6px;
  background-color: #fff7e6;
}
.temp-title {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  font-size: 13px;
  color: #ff9500;
}
.temp-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.temp-label {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}
.temp-input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  height: 32px;
  font-size: 12px;
}
.btn-temp {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background-color: #ff9500;
  font-size: 12px;
  color: white;
  white-space: nowrap;
}
.btn-temp:disabled {
  background-color: #ccc;
  color: #999;
}
/* 调试区域样式 */
.debug-log-box {
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  height: 200px;
  background: #f8f8f8;
  line-height: 1.4;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  white-space: pre-wrap;
}
.debug-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}
.btn-debug {
  padding: 8px 6px;
  border: 1px solid #007aff;
  border-radius: 4px;
  background-color: #f0f8ff;
  font-size: 10px;
  color: #007aff;
  text-align: center;
  white-space: nowrap;
}
.btn-debug:active {
  background-color: #007aff;
  color: white;
}
/* 测试按钮区域 */
.test-buttons-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e6eb;
}
.test-title {
  display: block;
  margin-bottom: 12px;
  font-weight: bold;
  font-size: 14px;
  color: #666;
}
.test-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.btn-test {
  padding: 8px 12px;
  border: 1px solid #007aff;
  border-radius: 6px;
  background-color: #f8f9ff;
  font-size: 12px;
  color: #007aff;
  transition: all 0.2s ease;
}
.btn-test:active {
  background-color: #007aff;
  color: white;
}
/* 原始数据测试区域 */
.raw-data-summary {
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  background: #f8f9fa;
}

.summary-text {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.summary-time {
  display: block;
  font-size: 12px;
  color: #666;
}

.raw-data-box {
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  height: 300px;
  background: #fafafa;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  line-height: 1.4;
  white-space: pre-wrap;
}

.raw-data-actions {
  display: flex;
  gap: 8px;
}

/* 加载动画 */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
