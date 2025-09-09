<script setup lang="ts" name="create">
import { computed, ref } from 'vue';

// --- 登录与通用状态 ---
const apiBaseUrl = ref('/api');
const email = ref('');
const password = ref('');
const token = ref<string | null>(null);
const loading = ref(false);
const result = ref<any>(null);

const prettyResult = computed(() => {
  try {
    return JSON.stringify(result.value, null, 2);
  } catch {
    return String(result.value);
  }
});

const debugScript = computed(() => {
  const currentToken = token.value || 'YOUR_TOKEN_HERE';

  return `// 🔍 500错误调试脚本 - 在浏览器控制台执行
// 当前Token: ${currentToken}

// 📋 已知情况：
// ✅ 假文件ID返回403 (Directus验证文件存在性)  
// ✅ 空数组返回200 (attachments字段权限正常)
// ❌ 真实文件ID返回500 (格式问题)

// 测试格式1: 简单ID数组 [fileId]
const testFormat1 = (fileId) => {
  return fetch('/api/items/contents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ${currentToken}'
    },
    body: JSON.stringify({
      title: 'Format Test 1 - Simple Array ' + Date.now(),
      body: 'Testing attachments format: [fileId]',
      type: 'post',
      attachments: [fileId]  // 简单字符串数组
    })
  })
  .then(res => {
    console.log('格式1结果:', res.status, res.statusText);
    return res.json().then(data => ({ status: res.status, data }));
  })
  .then(result => {
    console.log('格式1响应:', result);
    return result;
  })
  .catch(err => {
    console.error('格式1错误:', err);
    return { status: 'error', error: err };
  });
};

// 测试格式2: 对象数组 [{ id: fileId }]
const testFormat2 = (fileId) => {
  return fetch('/api/items/contents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ${currentToken}'
    },
    body: JSON.stringify({
      title: 'Format Test 2 - Object Array ' + Date.now(),
      body: 'Testing attachments format: [{ id: fileId }]',
      type: 'post',
      attachments: [{ "id": fileId }]  // 对象数组
    })
  })
  .then(res => {
    console.log('格式2结果:', res.status, res.statusText);
    return res.json().then(data => ({ status: res.status, data }));
  })
  .then(result => {
    console.log('格式2响应:', result);
    return result;
  });
};

// 批量测试所有格式
const testAllFormats = async (fileId) => {
  console.log('🚀 开始测试attachments格式，文件ID:', fileId);
  
  const result1 = await testFormat1(fileId);
  const result2 = await testFormat2(fileId);
  
  console.log('📊 测试总结:');
  console.log('格式1 [fileId]:', result1.status === 200 ? '✅成功' : '❌失败(' + result1.status + ')');
  console.log('格式2 [{ id: fileId }]:', result2.status === 200 ? '✅成功' : '❌失败(' + result2.status + ')');
  
  if (result1.status === 200) console.log('🎯 推荐使用格式1: 简单数组');
  else if (result2.status === 200) console.log('🎯 推荐使用格式2: 对象数组');
  else console.log('⚠️ 格式都失败，需要检查Directus配置');
};

// 使用说明:
console.log('📝 使用步骤:');
console.log('1. 先在页面上传文件获取真实文件ID');
console.log('2. 执行: testAllFormats("你的文件ID")');
console.log('');
console.log('🔧 快速测试:');
console.log('   testFormat1("文件ID")  // 测试简单数组');
console.log('   testFormat2("文件ID")  // 测试对象数组');`;
});

function setResult(payload: any) {
  result.value = payload;
}

// --- 登录逻辑 ---
async function login() {
  if (!email.value || !password.value) {
    setResult({
      action: 'login',
      success: false,
      message: '请先输入邮箱与密码'
    });
    return;
  }
  loading.value = true;
  try {
    const res: any = await uni.request({
      url: `${apiBaseUrl.value}/auth/login`,
      method: 'POST',
      data: { email: email.value, password: password.value },
      header: { 'Content-Type': 'application/json' }
    });
    if (res.statusCode && res.statusCode >= 400) {
      setResult({
        action: 'login',
        success: false,
        statusCode: res.statusCode,
        response: typeof res.data === 'string' ? res.data : res.data,
        tips: ['检查 Directus 配置、CORS 或账号密码']
      });
      return;
    }
    const data: any = res.data;
    const t = data?.data?.access_token || data?.access_token;
    token.value = t || null;
    setResult({
      action: 'login',
      success: !!t,
      statusCode: res.statusCode,
      tokenPresent: !!t
    });
  } catch (e: any) {
    setResult({
      action: 'login',
      success: false,
      error: { message: e?.message || String(e), errMsg: e?.errMsg },
      tips: ['request:fail 常见于 CORS 拒绝或服务未启动']
    });
  } finally {
    loading.value = false;
  }
}

function fillDemoAccount() {
  // 用户信息更新
  email.value = 'molly@mail.com';
  password.value = '123';
}

// 测试权限
async function testPermissions() {
  if (!token.value) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }

  loading.value = true;
  setResult({
    action: 'testPermissions',
    stage: 'testing',
    message: '测试权限中...',
    debugInfo: {
      apiBaseUrl: apiBaseUrl.value,
      requestUrl: `/api/items/contents`,
      fullUrl: `${window.location.origin}/api/items/contents`,
      token: token.value ? `${token.value.substring(0, 10)}...` : 'null',
      loginWorked: '登录时用的也是 /api，如果这里失败说明代理对某些端点不工作'
    }
  });

  try {
    // 测试读取权限
    const readRes: any = await uni.request({
      url: `/api/items/contents`,
      method: 'GET',
      data: { limit: 1 },
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`
      }
    });

    setResult({
      action: 'testPermissions',
      stage: 'read_test',
      success: readRes.statusCode < 300,
      statusCode: readRes.statusCode,
      message: `读取权限测试: ${readRes.statusCode < 300 ? '成功' : '失败'}`,
      data: readRes.data
    });

    // 如果读取成功，测试创建权限
    if (readRes.statusCode < 300) {
      const createRes: any = await uni.request({
        url: `/api/items/contents`,
        method: 'POST',
        data: {
          title: 'Permission Test',
          body: 'Testing create permission',
          type: 'post'
        },
        header: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.value}`
        }
      });

      setResult({
        action: 'testPermissions',
        stage: 'create_test',
        success: createRes.statusCode < 300,
        statusCode: createRes.statusCode,
        message: `创建权限测试: ${
          createRes.statusCode < 300 ? '成功' : '失败'
        }`,
        data: createRes.data,
        readSuccess: true
      });
    }
  } catch (error) {
    setResult({
      action: 'testPermissions',
      success: false,
      error,
      message: '权限测试失败'
    });
  } finally {
    loading.value = false;
  }
}

// 最小化测试创建权限
async function testMinimalCreate() {
  if (!token.value) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }

  loading.value = true;
  setResult({ action: 'testMinimalCreate', message: '测试最小化创建...' });

  try {
    // 只发送最必要的字段
    const minimalData = {
      title: `Minimal Test ${Date.now()}`
    };

    const res: any = await uni.request({
      url: `/api/items/contents`,
      method: 'POST',
      data: minimalData,
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`
      }
    });

    setResult({
      action: 'testMinimalCreate',
      success: res.statusCode < 300,
      statusCode: res.statusCode,
      requestData: minimalData,
      responseData: res.data,
      message: res.statusCode < 300 ? '最小测试成功！' : '最小测试失败'
    });
  } catch (error) {
    setResult({
      action: 'testMinimalCreate',
      success: false,
      error,
      message: '最小测试出错'
    });
  } finally {
    loading.value = false;
  }
}

// 测试 attachments 字段权限
async function testWithAttachments() {
  if (!token.value) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }

  loading.value = true;
  setResult({
    action: 'testWithAttachments',
    message: '测试 attachments 字段...'
  });

  try {
    // 先测试空的 attachments 数组
    const testData1 = {
      title: `Test Empty Attachments ${Date.now()}`,
      body: 'Testing empty attachments array',
      type: 'post',
      attachments: []
    };

    const res1: any = await uni.request({
      url: `/api/items/contents`,
      method: 'POST',
      data: testData1,
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`
      }
    });

    setResult({
      action: 'testWithAttachments',
      stage: 'empty_array_test',
      success: res1.statusCode < 300,
      statusCode: res1.statusCode,
      requestData: testData1,
      responseData: res1.data,
      message: `空数组测试: ${res1.statusCode < 300 ? '成功' : '失败'}`
    });

    // 如果空数组成功，再测试假的文件ID
    if (res1.statusCode < 300) {
      const testData2 = {
        title: `Test Fake File ID ${Date.now()}`,
        body: 'Testing fake file ID',
        type: 'post',
        attachments: [{ id: 'fake-file-id-12345' }]
      };

      const res2: any = await uni.request({
        url: `/api/items/contents`,
        method: 'POST',
        data: testData2,
        header: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.value}`
        }
      });

      setResult({
        action: 'testWithAttachments',
        stage: 'fake_id_test',
        success: res2.statusCode < 300,
        statusCode: res2.statusCode,
        requestData: testData2,
        responseData: res2.data,
        message: `假ID测试: ${res2.statusCode < 300 ? '成功' : '失败'}`,
        emptyArrayWorked: true
      });
    }
  } catch (error) {
    setResult({
      action: 'testWithAttachments',
      success: false,
      error,
      message: 'attachments测试出错'
    });
  } finally {
    loading.value = false;
  }
}

// --- 帖子上传逻辑 (一步到位) ---
const imagePath = ref(''); // 用来存储用户选择的图片本地路径
const postTitle = ref(''); // 帖子主题
const postDescription = ref(''); // 帖子描述

// 上传文件到 Directus /files 端点
const uploadFileToDirectus = (filePath: string) => {
  return new Promise<any>((resolve) => {
    setResult({
      action: 'uploadFileToDirectus',
      stage: 'sending_file',
      message: '开始上传文件到 /files 端点...',
      debug: {
        filePath,
        url: `${apiBaseUrl.value}/files`,
        expectedContentType: 'multipart/form-data'
      }
    });

    uni.uploadFile({
      url: `${apiBaseUrl.value}/files`,
      filePath,
      name: 'file', // Directus files 端点使用 'file' 作为字段名
      header: {
        Authorization: `Bearer ${token.value}`
        // 注意：不要手动设置 Content-Type，让 uni.uploadFile 自动设置
      },
      success: (res) => {
        // 详细记录文件上传响应
        setResult({
          action: 'file_upload_response',
          statusCode: res.statusCode,
          rawData: res.data,
          message: '文件上传响应详情'
        });

        try {
          const data = JSON.parse(res.data);
          if (res.statusCode >= 200 && res.statusCode < 300 && data?.data?.id) {
            resolve({
              success: true,
              fileId: data.data.id,
              fileData: data.data,
              fullResponse: data
            });
          } else {
            resolve({
              success: false,
              error: `文件上传失败，状态码: ${res.statusCode}`,
              response: data,
              statusCode: res.statusCode
            });
          }
        } catch (parseError: any) {
          resolve({
            success: false,
            error: '解析文件上传响应失败',
            rawResponse: res.data,
            parseError: parseError.message
          });
        }
      },
      fail: (err) => {
        resolve({
          success: false,
          error: err.errMsg || '文件上传请求失败',
          details: err
        });
      }
    });
  });
};

// 创建内容项到 /items/contents 端点
const createContentItem = (contentData: any) => {
  return new Promise<any>((resolve) => {
    // 记录发送的数据
    setResult({
      action: 'createContentItem',
      stage: 'sending_request',
      requestData: contentData,
      url: `${apiBaseUrl.value}/items/contents`,
      message: '发送创建内容请求...'
    });

    uni.request({
      url: `${apiBaseUrl.value}/items/contents`,
      method: 'POST',
      data: contentData,
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`
      },
      success: (res) => {
        // 详细记录响应信息
        setResult({
          action: 'createContentItem',
          stage: 'received_response',
          statusCode: res.statusCode,
          responseData: res.data,
          message: `收到响应，状态码: ${res.statusCode}`
        });

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            success: true,
            data: res.data?.data || res.data,
            statusCode: res.statusCode
          });
        } else {
          // 详细分析500错误响应
          const errorAnalysis =
            res.statusCode === 500
              ? {
                  serverError: '500内部服务器错误 - 可能的原因分析',
                  possibleCauses: [
                    'attachments字段格式不正确',
                    'Directus关系字段配置问题',
                    '文件ID格式或引用错误',
                    '数据库约束违反'
                  ],
                  responseBody: res.data,
                  suggestedAction: '尝试不同的attachments格式'
                }
              : {};

          resolve({
            success: false,
            error: `创建内容失败，状态码: ${res.statusCode}`,
            statusCode: res.statusCode,
            response: res.data,
            requestData: contentData,
            errorAnalysis
          });
        }
      },
      fail: (err) => {
        // 记录网络请求失败
        setResult({
          action: 'createContentItem',
          stage: 'request_failed',
          error: err,
          requestData: contentData,
          message: '网络请求失败'
        });

        resolve({
          success: false,
          error: err.errMsg || '创建内容请求失败',
          details: err
        });
      }
    });
  });
};

// 清空表单
const clearForm = () => {
  postTitle.value = '';
  postDescription.value = '';
  imagePath.value = '';
};

// 测试不同的attachments字段格式
async function testAttachmentsFormats() {
  if (!token.value) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }

  loading.value = true;
  setResult({
    action: 'testAttachmentsFormats',
    message: '开始测试不同的attachments格式...'
  });

  // 首先上传一个测试文件
  try {
    if (!imagePath.value) {
      uni.showToast({ title: '请先选择图片', icon: 'none' });
      loading.value = false;
      return;
    }

    setResult({
      action: 'testAttachmentsFormats',
      stage: 'uploading_file',
      message: '上传测试文件...'
    });

    const fileUploadResult = await uploadFileToDirectus(imagePath.value);
    if (!fileUploadResult.success) {
      throw new Error(`文件上传失败: ${fileUploadResult.error}`);
    }

    const fileId = fileUploadResult.fileId;
    setResult({
      action: 'testAttachmentsFormats',
      stage: 'file_uploaded',
      fileId,
      message: '文件上传成功，开始测试格式...'
    });

    // 测试格式1: 简单ID数组
    const format1 = {
      title: 'Test Format 1 - Simple Array',
      body: 'Testing attachments: [fileId]',
      type: 'post',
      attachments: [fileId]
    };

    setResult({
      action: 'testAttachmentsFormats',
      stage: 'format1',
      testData: format1,
      message: '测试格式1: 简单数组 [fileId]'
    });

    const result1 = await createContentItem(format1);

    setResult({
      action: 'testAttachmentsFormats',
      stage: 'format1_result',
      success: result1.success,
      statusCode: result1.statusCode,
      error: result1.error,
      response: result1.response,
      message: `格式1结果: ${
        result1.success ? '成功' : `失败 - ${result1.statusCode}`
      }`
    });

    // 如果格式1失败，测试格式2: 对象数组
    if (!result1.success) {
      const format2 = {
        title: 'Test Format 2 - Object Array',
        body: 'Testing attachments: [{ id: fileId }]',
        type: 'post',
        attachments: [{ id: fileId }]
      };

      setResult({
        action: 'testAttachmentsFormats',
        stage: 'format2',
        testData: format2,
        message: '测试格式2: 对象数组 [{ id: fileId }]'
      });

      const result2 = await createContentItem(format2);

      setResult({
        action: 'testAttachmentsFormats',
        stage: 'format2_result',
        success: result2.success,
        statusCode: result2.statusCode,
        error: result2.error,
        response: result2.response,
        message: `格式2结果: ${
          result2.success ? '成功' : `失败 - ${result2.statusCode}`
        }`
      });

      // 如果格式2也失败，测试格式3: Directus关系格式
      if (!result2.success) {
        const format3 = {
          title: 'Test Format 3 - Relationship',
          body: 'Testing attachments: relationship format',
          type: 'post',
          attachments: {
            create: [{ directus_files_id: fileId }],
            update: [],
            delete: []
          }
        };

        setResult({
          action: 'testAttachmentsFormats',
          stage: 'format3',
          testData: format3,
          message: '测试格式3: Directus关系格式'
        });

        const result3 = await createContentItem(format3);

        setResult({
          action: 'testAttachmentsFormats',
          stage: 'format3_result',
          success: result3.success,
          statusCode: result3.statusCode,
          error: result3.error,
          response: result3.response,
          message: `格式3结果: ${
            result3.success ? '成功' : `失败 - ${result3.statusCode}`
          }`,
          finalAnalysis: {
            format1: result1.success ? '成功' : `失败(${result1.statusCode})`,
            format2: result2.success ? '成功' : `失败(${result2.statusCode})`,
            format3: result3.success ? '成功' : `失败(${result3.statusCode})`,
            recommendation: result3.success
              ? '使用关系格式'
              : result2.success
              ? '使用对象数组'
              : result1.success
              ? '使用简单数组'
              : '所有格式都失败，需要检查Directus配置'
          }
        });
      }
    }
  } catch (error: any) {
    setResult({
      action: 'testAttachmentsFormats',
      success: false,
      error: error.message,
      message: '格式测试出错'
    });
  } finally {
    loading.value = false;
  }
}

// 单独测试假文件ID
async function testFakeFileId() {
  if (!token.value) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }

  loading.value = true;

  try {
    const testData = {
      title: `Test Fake File ID ${Date.now()}`,
      body: 'Testing fake file ID',
      type: 'post',
      attachments: [{ id: 'fake-file-id-12345' }]
    };

    setResult({
      action: 'testFakeFileId',
      stage: 'sending',
      requestData: testData,
      message: '发送假文件ID测试...'
    });

    const res: any = await uni.request({
      url: `/api/items/contents`,
      method: 'POST',
      data: testData,
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`
      }
    });

    setResult({
      action: 'testFakeFileId',
      success: res.statusCode < 300,
      statusCode: res.statusCode,
      requestData: testData,
      responseData: res.data,
      message: `假文件ID测试: ${
        res.statusCode < 300 ? '成功' : `失败 - 状态码${res.statusCode}`
      }`,
      analysis:
        res.statusCode === 403
          ? '403错误！说明Directus验证了文件ID的有效性'
          : '其他状态码'
    });
  } catch (error) {
    setResult({
      action: 'testFakeFileId',
      success: false,
      error,
      message: '假文件ID测试出错'
    });
  } finally {
    loading.value = false;
  }
}

const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      imagePath.value = res.tempFilePaths[0];
      setResult({
        action: 'chooseImage',
        success: true,
        path: imagePath.value
      });
    },
    fail: (err) => {
      uni.showToast({ title: '选择图片失败', icon: 'none' });
      setResult({ action: 'chooseImage', success: false, error: err });
    }
  });
};

const handleUpload = async () => {
  // 验证必填字段
  if (!postTitle.value.trim()) {
    uni.showToast({ title: '请输入帖子主题', icon: 'none' });
    return;
  }
  if (!postDescription.value.trim()) {
    uni.showToast({ title: '请输入帖子描述', icon: 'none' });
    return;
  }
  if (!token.value) {
    uni.showToast({ title: '请先登录获取Token', icon: 'none' });
    setResult({ action: 'handleUpload', success: false, message: '请先登录' });
    return;
  }

  uni.showLoading({ title: '发布中...' });
  loading.value = true;

  try {
    let fileId = null;

    setResult({
      action: 'handleUpload',
      stage: 'start',
      message: '开始发布流程...',
      debug: {
        hasImage: !!imagePath.value,
        imagePath: imagePath.value || 'none',
        title: postTitle.value,
        body: `${postDescription.value.substring(0, 50)}...`
      }
    });

    // 第一步: 如果有图片，先上传到 /files 端点
    if (imagePath.value) {
      setResult({
        action: 'upload_step1',
        stage: 'uploading_file',
        message: '正在上传图片...'
      });

      const fileUploadResult = await uploadFileToDirectus(imagePath.value);
      if (fileUploadResult.success) {
        fileId = fileUploadResult.fileId;
        setResult({
          action: 'upload_step1',
          success: true,
          fileId,
          message: `图片上传成功，文件ID: ${fileId}`
        });
      } else {
        throw new Error(`图片上传失败: ${fileUploadResult.error}`);
      }
    } else {
      setResult({
        action: 'upload_step1',
        message: '跳过图片上传（无图片选择）'
      });
    }

    // 第二步: 创建内容项
    setResult({
      action: 'upload_step2',
      stage: 'creating_content',
      message: '正在创建帖子...',
      tokenValid: !!token.value,
      tokenLength: token.value?.length
    });

    const contentData = {
      title: postTitle.value.trim(),
      body: postDescription.value.trim(),
      type: 'post'
    };

    // 如果有文件ID，添加到数据中
    if (fileId) {
      // ✅ 使用测试确认的正确格式：Directus关系格式
      contentData.attachments = {
        create: [{ directus_files_id: fileId }],
        update: [],
        delete: []
      };

      setResult({
        action: 'debug_attachments',
        message: '使用正确的Directus关系格式发送附件数据',
        contentData,
        fileId,
        attachmentsFormat: 'directus_relationship_format',
        formatConfirmed: '✅ 格式3测试成功，使用关系格式'
      });
    } else {
      setResult({
        action: 'debug_no_attachments',
        message: '准备发送无附件的数据',
        contentData
      });
    }

    const contentResult = await createContentItem(contentData);
    if (contentResult.success) {
      uni.showToast({ title: '发布成功！' });
      clearForm();
      setResult({
        action: 'handleUpload',
        success: true,
        fileId,
        contentId: contentResult.data?.id,
        data: contentResult.data,
        message: '帖子发布成功！'
      });
    } else {
      throw new Error(`创建帖子失败: ${contentResult.error}`);
    }
  } catch (error) {
    uni.showToast({ title: '发布失败，请查看详情', icon: 'none' });
    setResult({
      action: 'handleUpload',
      success: false,
      error: error.message,
      tips: ['检查网络连接', '确认Token是否有效', '检查Directus端点配置']
    });
  } finally {
    uni.hideLoading();
    loading.value = false;
  }
};

// 复制结果
function copyResult() {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(prettyResult.value)
        .then(() => {
          uni.showToast({ title: '复制成功', icon: 'success' });
        })
        .catch(() => {
          fallbackCopyTextToClipboard(prettyResult.value);
        });
    } else {
      fallbackCopyTextToClipboard(prettyResult.value);
    }
  } catch (error) {
    uni.showToast({ title: '复制失败', icon: 'error' });
  }
}

// 复制调试脚本
function copyDebugScript() {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(debugScript.value)
        .then(() => {
          uni.showToast({
            title: '调试脚本已复制！\n可在浏览器控制台粘贴执行',
            icon: 'success'
          });
        })
        .catch(() => {
          fallbackCopyTextToClipboard(debugScript.value);
        });
    } else {
      fallbackCopyTextToClipboard(debugScript.value);
    }
  } catch (error) {
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
  } catch (err) {
    uni.showToast({ title: '复制失败，请手动选择复制', icon: 'error' });
  }

  document.body.removeChild(textArea);
}
</script>

<template>
  <view class="create-poc">
    <!-- 基础配置区 -->
    <view class="section">
      <view class="row">
        <text class="label">Directus BaseURL</text>
        <input
          v-model="apiBaseUrl"
          class="input"
          type="text"
          placeholder="http://localhost:8055"
        />
      </view>
      <view class="row">
        <text class="label">邮箱</text>
        <input
          v-model="email"
          class="input"
          type="text"
          placeholder="请输入邮箱"
        />
      </view>
      <view class="row">
        <text class="label">密码</text>
        <input
          v-model="password"
          class="input"
          type="password"
          placeholder="请输入密码"
        />
      </view>
      <view class="row gap">
        <button size="mini" @tap="fillDemoAccount">填入演示账号</button>
        <button type="primary" :disabled="loading" @tap="login">
          登录获取 Token
        </button>
        <button
          size="mini"
          type="info"
          :disabled="!token || loading"
          @tap="testPermissions"
        >
          测试权限
        </button>
        <button
          size="mini"
          type="warning"
          :disabled="!token || loading"
          @tap="testMinimalCreate"
        >
          最小测试
        </button>
        <button
          size="mini"
          style="font-size: 10px"
          :disabled="!token || loading"
          @tap="testWithAttachments"
        >
          测试附件字段
        </button>
        <button
          size="mini"
          style="font-size: 10px"
          :disabled="!token || loading"
          @tap="testFakeFileId"
        >
          测试假ID
        </button>
        <button
          size="mini"
          type="warn"
          style="font-size: 10px"
          :disabled="!token || loading || !imagePath"
          @tap="testAttachmentsFormats"
        >
          格式测试
        </button>
        <text v-if="token" class="token">Token 已获取</text>
      </view>
    </view>

    <!-- 发帖区 -->
    <view class="section">
      <view class="form-title">✏️ 发布帖子</view>

      <!-- 帖子主题 -->
      <view class="row">
        <text class="label">主题 *</text>
        <input
          v-model="postTitle"
          class="input"
          type="text"
          placeholder="请输入帖子主题"
          maxlength="100"
        />
      </view>

      <!-- 帖子描述 -->
      <view class="row">
        <text class="label">描述 *</text>
        <textarea
          v-model="postDescription"
          class="textarea"
          placeholder="请输入帖子描述内容..."
          maxlength="1000"
          show-confirm-bar="false"
        />
      </view>

      <!-- 图片选择 -->
      <view class="row">
        <text class="label">图片</text>
        <button
          size="mini"
          type="default"
          :disabled="loading"
          @click="chooseImage"
        >
          {{ imagePath ? '重新选择' : '选择图片' }}
        </button>
      </view>

      <!-- 图片预览 -->
      <view v-if="imagePath" class="image-preview">
        <image :src="imagePath" mode="aspectFit" class="preview-image" />
        <view class="image-path">{{ imagePath }}</view>
        <button size="mini" type="warn" @click="imagePath = ''">
          移除图片
        </button>
      </view>

      <!-- 发布按钮 -->
      <view class="row">
        <button
          type="primary"
          :disabled="!postTitle.trim() || !postDescription.trim() || loading"
          :loading="loading"
          style="width: 100%"
          @click="handleUpload"
        >
          {{ loading ? '发布中...' : '发布帖子' }}
        </button>
      </view>

      <!-- 清空按钮 -->
      <view class="row">
        <button
          size="mini"
          type="default"
          :disabled="loading"
          @click="clearForm"
        >
          清空表单
        </button>
      </view>
    </view>

    <!-- 调试助手 -->
    <view class="section">
      <view class="result-header">
        <text class="label">🔍 调试助手</text>
        <button size="mini" type="warning" @tap="copyDebugScript">
          复制调试脚本
        </button>
      </view>
      <scroll-view class="debug-helper" scroll-y>
        <text selectable>{{ debugScript }}</text>
      </scroll-view>
    </view>

    <!-- 结果展示 -->
    <view class="section">
      <view class="result-header">
        <text class="label">结果</text>
        <button size="mini" type="info" @tap="copyResult">复制结果</button>
      </view>
      <scroll-view class="result" scroll-y>
        <text selectable>{{ prettyResult }}</text>
      </scroll-view>
    </view>
  </view>
</template>

<style scoped>
.create-poc {
  padding: 12px;
  font-size: 14px;
}
.section {
  margin-bottom: 12px;
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.gap button {
  margin-right: 8px;
}
.label {
  width: 120px;
  color: #555;
}
.input {
  flex: 1;
  height: 36px;
  padding: 6px 8px;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  background: #fafafa;
}
.result {
  height: 220px;
  padding: 8px;
  background: #0b1020;
  color: #b7c5ff;
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: pre-wrap;
}
.token {
  color: #07c160;
  margin-left: 8px;
}
.form-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #333;
}
.textarea {
  flex: 1;
  min-height: 80px;
  padding: 8px;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  background: #fafafa;
  font-size: 14px;
  line-height: 1.4;
}
.image-preview {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e5e6eb;
}
.preview-image {
  width: 120px;
  height: 120px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 8px;
}
.image-path {
  font-size: 12px;
  color: #666;
  word-break: break-all;
  margin-bottom: 8px;
  padding: 4px 8px;
  background: #fff;
  border-radius: 4px;
}
.debug-helper {
  height: 300px;
  padding: 8px;
  background: #1e1e1e;
  color: #d4d4aa;
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: pre-wrap;
  font-size: 12px;
  line-height: 1.4;
}
</style>
