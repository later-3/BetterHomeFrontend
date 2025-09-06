# 测试指南

> 全面的测试策略、工具配置和最佳实践

## 🎯 测试策略概览

### 测试金字塔

```mermaid
pyramid
  title 测试金字塔
  top "E2E 测试"
    "集成测试"
      "单元测试"
```

| 测试类型 | 占比 | 特点 | 工具 |
|---------|------|------|------|
| 单元测试 | 70% | 快速、隔离、可靠 | Vitest, Jest |
| 集成测试 | 20% | 模块间交互 | Vue Test Utils |
| E2E 测试 | 10% | 用户场景验证 | Playwright, Cypress |

### 测试覆盖目标

- **代码覆盖率**: ≥ 80%
- **分支覆盖率**: ≥ 75%
- **函数覆盖率**: ≥ 90%
- **行覆盖率**: ≥ 85%

---

## 🔧 测试环境配置

### 1. Vitest 配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    // 测试环境
    environment: 'jsdom',
    
    // 全局配置
    globals: true,
    
    // 设置文件
    setupFiles: ['./tests/setup.ts'],
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/'
      ],
      thresholds: {
        global: {
          branches: 75,
          functions: 90,
          lines: 85,
          statements: 85
        }
      }
    },
    
    // 测试文件匹配
    include: [
      'tests/**/*.{test,spec}.{js,ts}',
      'src/**/__tests__/*.{test,spec}.{js,ts}'
    ],
    
    // 排除文件
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache'
    ]
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@tests': resolve(__dirname, 'tests')
    }
  }
})
```

### 2. 测试设置文件

```typescript
// tests/setup.ts
import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// 全局测试配置
config.global.plugins = []

// Mock uni-app API
const mockUni = {
  showToast: vi.fn(),
  showModal: vi.fn(),
  navigateTo: vi.fn(),
  redirectTo: vi.fn(),
  switchTab: vi.fn(),
  navigateBack: vi.fn(),
  request: vi.fn(),
  uploadFile: vi.fn(),
  downloadFile: vi.fn(),
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  clearStorageSync: vi.fn()
}

// 全局 uni 对象
global.uni = mockUni

// Mock console 方法（可选）
global.console = {
  ...console,
  // 在测试中静默某些日志
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

// 清理函数
afterEach(() => {
  vi.clearAllMocks()
})
```

### 3. 测试工具函数

```typescript
// tests/utils/test-utils.ts
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { Component } from 'vue'

// 创建测试用的 Pinia 实例
export function createTestPinia() {
  return createPinia()
}

// 挂载组件的辅助函数
export function mountComponent(component: Component, options: any = {}) {
  const pinia = createTestPinia()
  
  return mount(component, {
    global: {
      plugins: [pinia],
      stubs: {
        // 存根不需要测试的组件
        'router-link': true,
        'router-view': true
      }
    },
    ...options
  })
}

// 等待异步操作完成
export async function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// 模拟用户交互
export class UserInteraction {
  constructor(private wrapper: VueWrapper<any>) {}
  
  async click(selector: string) {
    const element = this.wrapper.find(selector)
    await element.trigger('click')
    await flushPromises()
    return this
  }
  
  async input(selector: string, value: string) {
    const element = this.wrapper.find(selector)
    await element.setValue(value)
    await flushPromises()
    return this
  }
  
  async submit(selector: string = 'form') {
    const form = this.wrapper.find(selector)
    await form.trigger('submit')
    await flushPromises()
    return this
  }
}

export function createUserInteraction(wrapper: VueWrapper<any>) {
  return new UserInteraction(wrapper)
}
```

---

## 🧪 单元测试

### 1. 组件测试

```typescript
// tests/components/Button.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mountComponent, createUserInteraction } from '@tests/utils/test-utils'
import Button from '@/components/base/Button.vue'

describe('Button 组件', () => {
  it('应该正确渲染按钮文本', () => {
    const wrapper = mountComponent(Button, {
      props: {
        text: '点击我'
      }
    })
    
    expect(wrapper.text()).toBe('点击我')
  })
  
  it('应该在点击时触发事件', async () => {
    const onClick = vi.fn()
    const wrapper = mountComponent(Button, {
      props: {
        text: '点击我',
        onClick
      }
    })
    
    const interaction = createUserInteraction(wrapper)
    await interaction.click('button')
    
    expect(onClick).toHaveBeenCalledTimes(1)
  })
  
  it('应该在禁用状态下不触发事件', async () => {
    const onClick = vi.fn()
    const wrapper = mountComponent(Button, {
      props: {
        text: '点击我',
        disabled: true,
        onClick
      }
    })
    
    const interaction = createUserInteraction(wrapper)
    await interaction.click('button')
    
    expect(onClick).not.toHaveBeenCalled()
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })
  
  it('应该正确应用不同的按钮类型样式', () => {
    const types = ['primary', 'secondary', 'danger']
    
    types.forEach(type => {
      const wrapper = mountComponent(Button, {
        props: {
          text: '按钮',
          type
        }
      })
      
      expect(wrapper.find('button').classes()).toContain(`btn-${type}`)
    })
  })
  
  it('应该支持加载状态', () => {
    const wrapper = mountComponent(Button, {
      props: {
        text: '提交',
        loading: true
      }
    })
    
    expect(wrapper.find('.loading-icon').exists()).toBe(true)
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })
})
```

### 2. Composables 测试

```typescript
// tests/composables/useCounter.test.ts
import { describe, it, expect } from 'vitest'
import { useCounter } from '@/composables/useCounter'

describe('useCounter', () => {
  it('应该初始化为默认值', () => {
    const { count, increment, decrement, reset } = useCounter()
    
    expect(count.value).toBe(0)
  })
  
  it('应该初始化为指定值', () => {
    const { count } = useCounter(10)
    
    expect(count.value).toBe(10)
  })
  
  it('应该正确递增', () => {
    const { count, increment } = useCounter(5)
    
    increment()
    expect(count.value).toBe(6)
    
    increment(3)
    expect(count.value).toBe(9)
  })
  
  it('应该正确递减', () => {
    const { count, decrement } = useCounter(10)
    
    decrement()
    expect(count.value).toBe(9)
    
    decrement(4)
    expect(count.value).toBe(5)
  })
  
  it('应该正确重置', () => {
    const { count, increment, reset } = useCounter(0)
    
    increment(5)
    expect(count.value).toBe(5)
    
    reset()
    expect(count.value).toBe(0)
  })
  
  it('应该支持最小值限制', () => {
    const { count, decrement } = useCounter(0, { min: 0 })
    
    decrement(5)
    expect(count.value).toBe(0)
  })
  
  it('应该支持最大值限制', () => {
    const { count, increment } = useCounter(8, { max: 10 })
    
    increment(5)
    expect(count.value).toBe(10)
  })
})
```

### 3. Store 测试

```typescript
// tests/stores/user.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import * as userApi from '@/api/user'

// Mock API
vi.mock('@/api/user', () => ({
  getUserInfo: vi.fn(),
  updateUserInfo: vi.fn(),
  login: vi.fn(),
  logout: vi.fn()
}))

describe('User Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })
  
  it('应该初始化为默认状态', () => {
    const store = useUserStore()
    
    expect(store.userInfo).toBeNull()
    expect(store.isLoggedIn).toBe(false)
    expect(store.loading).toBe(false)
  })
  
  it('应该正确处理登录', async () => {
    const mockUserInfo = {
      id: '1',
      name: '张三',
      email: 'zhangsan@example.com'
    }
    
    vi.mocked(userApi.login).mockResolvedValue({
      code: 200,
      data: {
        token: 'mock-token',
        userInfo: mockUserInfo
      }
    })
    
    const store = useUserStore()
    await store.login('zhangsan@example.com', 'password')
    
    expect(store.userInfo).toEqual(mockUserInfo)
    expect(store.isLoggedIn).toBe(true)
    expect(userApi.login).toHaveBeenCalledWith('zhangsan@example.com', 'password')
  })
  
  it('应该正确处理登录失败', async () => {
    vi.mocked(userApi.login).mockRejectedValue(new Error('登录失败'))
    
    const store = useUserStore()
    
    await expect(store.login('wrong@example.com', 'wrong')).rejects.toThrow('登录失败')
    expect(store.userInfo).toBeNull()
    expect(store.isLoggedIn).toBe(false)
  })
  
  it('应该正确处理登出', async () => {
    const store = useUserStore()
    
    // 先设置登录状态
    store.userInfo = {
      id: '1',
      name: '张三',
      email: 'zhangsan@example.com'
    }
    
    await store.logout()
    
    expect(store.userInfo).toBeNull()
    expect(store.isLoggedIn).toBe(false)
    expect(userApi.logout).toHaveBeenCalled()
  })
  
  it('应该正确更新用户信息', async () => {
    const updatedInfo = {
      id: '1',
      name: '李四',
      email: 'lisi@example.com'
    }
    
    vi.mocked(userApi.updateUserInfo).mockResolvedValue({
      code: 200,
      data: updatedInfo
    })
    
    const store = useUserStore()
    await store.updateUserInfo(updatedInfo)
    
    expect(store.userInfo).toEqual(updatedInfo)
    expect(userApi.updateUserInfo).toHaveBeenCalledWith(updatedInfo)
  })
})
```

### 4. 工具函数测试

```typescript
// tests/utils/format.test.ts
import { describe, it, expect } from 'vitest'
import { formatDate, formatCurrency, formatFileSize } from '@/utils/format'

describe('格式化工具函数', () => {
  describe('formatDate', () => {
    it('应该正确格式化日期', () => {
      const date = new Date('2024-01-15T10:30:00')
      
      expect(formatDate(date)).toBe('2024-01-15')
      expect(formatDate(date, 'YYYY-MM-DD HH:mm')).toBe('2024-01-15 10:30')
      expect(formatDate(date, 'MM/DD/YYYY')).toBe('01/15/2024')
    })
    
    it('应该处理无效日期', () => {
      expect(formatDate(null)).toBe('')
      expect(formatDate(undefined)).toBe('')
      expect(formatDate('invalid')).toBe('')
    })
  })
  
  describe('formatCurrency', () => {
    it('应该正确格式化货币', () => {
      expect(formatCurrency(1234.56)).toBe('¥1,234.56')
      expect(formatCurrency(0)).toBe('¥0.00')
      expect(formatCurrency(1000000)).toBe('¥1,000,000.00')
    })
    
    it('应该支持不同货币符号', () => {
      expect(formatCurrency(100, '$')).toBe('$100.00')
      expect(formatCurrency(100, '€')).toBe('€100.00')
    })
    
    it('应该处理无效数值', () => {
      expect(formatCurrency(null)).toBe('¥0.00')
      expect(formatCurrency(undefined)).toBe('¥0.00')
      expect(formatCurrency('invalid')).toBe('¥0.00')
    })
  })
  
  describe('formatFileSize', () => {
    it('应该正确格式化文件大小', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(1024)).toBe('1.00 KB')
      expect(formatFileSize(1048576)).toBe('1.00 MB')
      expect(formatFileSize(1073741824)).toBe('1.00 GB')
    })
    
    it('应该支持自定义精度', () => {
      expect(formatFileSize(1536, 1)).toBe('1.5 KB')
      expect(formatFileSize(1536, 0)).toBe('2 KB')
    })
  })
})
```

---

## 🔗 集成测试

### 1. 页面集成测试

```typescript
// tests/pages/UserProfile.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountComponent, createUserInteraction, flushPromises } from '@tests/utils/test-utils'
import UserProfile from '@/pages/user/profile/index.vue'
import * as userApi from '@/api/user'

vi.mock('@/api/user')

describe('用户资料页面', () => {
  const mockUserInfo = {
    id: '1',
    name: '张三',
    email: 'zhangsan@example.com',
    avatar: 'https://example.com/avatar.jpg',
    phone: '13800138000'
  }
  
  beforeEach(() => {
    vi.mocked(userApi.getUserInfo).mockResolvedValue({
      code: 200,
      data: mockUserInfo
    })
  })
  
  it('应该正确加载和显示用户信息', async () => {
    const wrapper = mountComponent(UserProfile)
    
    // 等待异步数据加载
    await flushPromises()
    
    expect(wrapper.find('[data-testid="user-name"]').text()).toBe('张三')
    expect(wrapper.find('[data-testid="user-email"]').text()).toBe('zhangsan@example.com')
    expect(wrapper.find('[data-testid="user-phone"]').text()).toBe('13800138000')
  })
  
  it('应该支持编辑用户信息', async () => {
    vi.mocked(userApi.updateUserInfo).mockResolvedValue({
      code: 200,
      data: { ...mockUserInfo, name: '李四' }
    })
    
    const wrapper = mountComponent(UserProfile)
    await flushPromises()
    
    const interaction = createUserInteraction(wrapper)
    
    // 点击编辑按钮
    await interaction.click('[data-testid="edit-button"]')
    
    // 修改姓名
    await interaction.input('[data-testid="name-input"]', '李四')
    
    // 提交表单
    await interaction.click('[data-testid="save-button"]')
    
    expect(userApi.updateUserInfo).toHaveBeenCalledWith({
      ...mockUserInfo,
      name: '李四'
    })
  })
  
  it('应该处理加载错误', async () => {
    vi.mocked(userApi.getUserInfo).mockRejectedValue(new Error('网络错误'))
    
    const wrapper = mountComponent(UserProfile)
    await flushPromises()
    
    expect(wrapper.find('[data-testid="error-message"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="error-message"]').text()).toContain('加载失败')
  })
})
```

### 2. API 集成测试

```typescript
// tests/api/user.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getUserInfo, updateUserInfo, login } from '@/api/user'
import { request } from '@/utils/request'

vi.mock('@/utils/request')

describe('用户 API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('getUserInfo', () => {
    it('应该正确获取用户信息', async () => {
      const mockResponse = {
        code: 200,
        data: {
          id: '1',
          name: '张三',
          email: 'zhangsan@example.com'
        }
      }
      
      vi.mocked(request.get).mockResolvedValue(mockResponse)
      
      const result = await getUserInfo('1')
      
      expect(request.get).toHaveBeenCalledWith('/api/user/1')
      expect(result).toEqual(mockResponse)
    })
    
    it('应该处理 API 错误', async () => {
      vi.mocked(request.get).mockRejectedValue(new Error('网络错误'))
      
      await expect(getUserInfo('1')).rejects.toThrow('网络错误')
    })
  })
  
  describe('updateUserInfo', () => {
    it('应该正确更新用户信息', async () => {
      const updateData = {
        name: '李四',
        email: 'lisi@example.com'
      }
      
      const mockResponse = {
        code: 200,
        data: {
          id: '1',
          ...updateData
        }
      }
      
      vi.mocked(request.put).mockResolvedValue(mockResponse)
      
      const result = await updateUserInfo('1', updateData)
      
      expect(request.put).toHaveBeenCalledWith('/api/user/1', updateData)
      expect(result).toEqual(mockResponse)
    })
  })
  
  describe('login', () => {
    it('应该正确处理登录', async () => {
      const credentials = {
        email: 'zhangsan@example.com',
        password: 'password123'
      }
      
      const mockResponse = {
        code: 200,
        data: {
          token: 'mock-jwt-token',
          userInfo: {
            id: '1',
            name: '张三',
            email: 'zhangsan@example.com'
          }
        }
      }
      
      vi.mocked(request.post).mockResolvedValue(mockResponse)
      
      const result = await login(credentials.email, credentials.password)
      
      expect(request.post).toHaveBeenCalledWith('/api/auth/login', credentials)
      expect(result).toEqual(mockResponse)
    })
  })
})
```

---

## 🎭 E2E 测试

### 1. Playwright 配置

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  
  // 并行运行测试
  fullyParallel: true,
  
  // 失败时重试次数
  retries: process.env.CI ? 2 : 0,
  
  // 并行工作进程数
  workers: process.env.CI ? 1 : undefined,
  
  // 报告配置
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  use: {
    // 基础 URL
    baseURL: 'http://localhost:3000',
    
    // 浏览器上下文配置
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  
  // 项目配置
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    }
  ],
  
  // 开发服务器配置
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
})
```

### 2. E2E 测试用例

```typescript
// tests/e2e/user-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('用户流程测试', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前的准备工作
    await page.goto('/')
  })
  
  test('用户注册流程', async ({ page }) => {
    // 导航到注册页面
    await page.click('[data-testid="register-link"]')
    await expect(page).toHaveURL('/register')
    
    // 填写注册表单
    await page.fill('[data-testid="name-input"]', '测试用户')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.fill('[data-testid="confirm-password-input"]', 'password123')
    
    // 提交表单
    await page.click('[data-testid="register-button"]')
    
    // 验证注册成功
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page).toHaveURL('/login')
  })
  
  test('用户登录流程', async ({ page }) => {
    // 导航到登录页面
    await page.click('[data-testid="login-link"]')
    await expect(page).toHaveURL('/login')
    
    // 填写登录表单
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    
    // 提交登录
    await page.click('[data-testid="login-button"]')
    
    // 验证登录成功
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible()
  })
  
  test('用户资料编辑流程', async ({ page }) => {
    // 先登录
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    // 导航到用户资料页面
    await page.click('[data-testid="user-avatar"]')
    await page.click('[data-testid="profile-link"]')
    await expect(page).toHaveURL('/user/profile')
    
    // 编辑用户信息
    await page.click('[data-testid="edit-button"]')
    await page.fill('[data-testid="name-input"]', '更新的用户名')
    await page.fill('[data-testid="phone-input"]', '13800138000')
    
    // 保存更改
    await page.click('[data-testid="save-button"]')
    
    // 验证更新成功
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
    await expect(page.locator('[data-testid="user-name"]')).toHaveText('更新的用户名')
  })
  
  test('响应式设计测试', async ({ page }) => {
    // 测试桌面视图
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible()
    await expect(page.locator('[data-testid="mobile-nav"]')).not.toBeVisible()
    
    // 测试移动视图
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible()
    await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible()
    
    // 测试移动导航
    await page.click('[data-testid="mobile-menu-button"]')
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
  })
})
```

### 3. 页面对象模式

```typescript
// tests/e2e/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly loginButton: Locator
  readonly errorMessage: Locator
  
  constructor(page: Page) {
    this.page = page
    this.emailInput = page.locator('[data-testid="email-input"]')
    this.passwordInput = page.locator('[data-testid="password-input"]')
    this.loginButton = page.locator('[data-testid="login-button"]')
    this.errorMessage = page.locator('[data-testid="error-message"]')
  }
  
  async goto() {
    await this.page.goto('/login')
  }
  
  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.loginButton.click()
  }
  
  async getErrorMessage() {
    return await this.errorMessage.textContent()
  }
}
```

---

## 📊 测试报告和覆盖率

### 1. 生成测试报告

```json
// package.json scripts
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:report": "playwright show-report"
  }
}
```

### 2. CI/CD 集成

```yaml
# .github/workflows/test.yml
name: 测试流水线

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: 设置 Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: 安装依赖
      run: npm ci
    
    - name: 运行单元测试
      run: npm run test:coverage
    
    - name: 上传覆盖率报告
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
    
    - name: 运行 E2E 测试
      run: |
        npx playwright install --with-deps
        npm run test:e2e
    
    - name: 上传测试报告
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

---

## 🎯 测试最佳实践

### 1. 测试命名规范

```typescript
// ✅ 好的测试命名
describe('UserService', () => {
  describe('getUserById', () => {
    it('应该返回用户信息当用户存在时', () => {})
    it('应该抛出错误当用户不存在时', () => {})
    it('应该抛出错误当ID无效时', () => {})
  })
})

// ❌ 不好的测试命名
describe('UserService', () => {
  it('test1', () => {})
  it('getUserById works', () => {})
  it('error case', () => {})
})
```

### 2. 测试数据管理

```typescript
// tests/fixtures/user.ts
export const userFixtures = {
  validUser: {
    id: '1',
    name: '张三',
    email: 'zhangsan@example.com',
    phone: '13800138000'
  },
  
  adminUser: {
    id: '2',
    name: '管理员',
    email: 'admin@example.com',
    role: 'admin'
  },
  
  incompleteUser: {
    id: '3',
    name: '李四'
    // 缺少 email
  }
}

export const createUser = (overrides = {}) => ({
  ...userFixtures.validUser,
  ...overrides
})
```

### 3. Mock 策略

```typescript
// 模块级别 Mock
vi.mock('@/api/user', () => ({
  getUserInfo: vi.fn(),
  updateUserInfo: vi.fn()
}))

// 条件 Mock
const mockGetUserInfo = vi.fn()
vi.mock('@/api/user', async () => {
  const actual = await vi.importActual('@/api/user')
  return {
    ...actual,
    getUserInfo: mockGetUserInfo
  }
})

// 部分 Mock
vi.mock('@/utils/request', () => ({
  request: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))
```

### 4. 异步测试处理

```typescript
// ✅ 正确的异步测试
it('应该正确处理异步操作', async () => {
  const promise = asyncFunction()
  await expect(promise).resolves.toBe('expected result')
})

// ✅ 使用 waitFor 等待条件
it('应该等待元素出现', async () => {
  render(<Component />)
  await waitFor(() => {
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})

// ❌ 忘记等待异步操作
it('错误的异步测试', () => {
  asyncFunction() // 没有 await
  expect(result).toBe('expected') // 可能在异步操作完成前执行
})
```

---

## 🔧 测试工具和插件

### 推荐工具

- **Vitest**: 快速的单元测试框架
- **Vue Test Utils**: Vue 组件测试工具
- **Playwright**: 现代 E2E 测试框架
- **MSW**: API Mock 服务
- **Testing Library**: 用户行为驱动的测试工具

### VSCode 插件

- **Vitest**: Vitest 测试运行器
- **Playwright Test for VSCode**: Playwright 集成
- **Jest Runner**: 测试运行和调试
- **Coverage Gutters**: 代码覆盖率显示

---

*最后更新: 2024年*
*维护者: 开发团队*