# T5: 表单验证系统开发

## 任务概述
构建完整的表单验证系统，包括客户端实时验证、服务端验证和用户友好的错误提示机制。

## 技术要求
- **框架**: Vue 3 + TypeScript + uni-app
- **验证库**: 自定义验证规则或集成验证框架
- **状态管理**: Pinia
- **依赖**: 与 T1-T4 并行开发，最后集成

## 功能规格

### 验证范围
1. **内容验证**: 标题、正文、图片格式等
2. **分类验证**: 必选项检查和规则验证
3. **位置验证**: 位置信息完整性检查
4. **业务规则**: 社区内容发布规范

### 验证时机
- **实时验证**: 输入时即时反馈
- **提交验证**: 发布前完整性检查
- **服务端验证**: 安全性二次验证

## 开发指导

### 验证系统架构
```typescript
// types/validation.ts
interface ValidationRule {
  field: string
  type: 'required' | 'length' | 'format' | 'custom'
  message: string
  validator?: (value: any) => boolean
  params?: any
}

interface ValidationResult {
  isValid: boolean
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
}

interface FormValidationState {
  rules: ValidationRule[]
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
  isValidating: boolean
  hasValidated: boolean
}
```

### 核心验证类设计
```typescript
// utils/validator.ts
class FormValidator {
  private rules: ValidationRule[] = []
  
  // TODO: 实现验证器核心方法
  addRule(rule: ValidationRule): void {
    // 添加验证规则
  }
  
  validate(data: Record<string, any>): ValidationResult {
    // 执行验证逻辑
  }
  
  validateField(field: string, value: any): ValidationResult {
    // 单字段验证
  }
  
  private executeRule(rule: ValidationRule, value: any): boolean {
    // 执行具体验证规则
  }
}
```

### 验证规则配置
```typescript
// config/validationRules.ts
export const POST_VALIDATION_RULES: ValidationRule[] = [
  // TODO: 配置具体的验证规则
  {
    field: 'title',
    type: 'required',
    message: '标题不能为空'
  },
  {
    field: 'title',
    type: 'length',
    message: '标题长度应在2-50个字符之间',
    params: { min: 2, max: 50 }
  },
  {
    field: 'content',
    type: 'required',
    message: '内容不能为空'
  },
  {
    field: 'content',
    type: 'length',
    message: '内容长度应在10-5000个字符之间',
    params: { min: 10, max: 5000 }
  },
  {
    field: 'images',
    type: 'custom',
    message: '图片数量不能超过9张',
    validator: (images: string[]) => images.length <= 9
  },
  // 更多规则...
]
```

## 实时验证集成

### Vue 组件集成
```vue
<template>
  <view class="form-validation">
    <!-- 标题输入 -->
    <view class="field-group">
      <u-input
        v-model="formData.title"
        @blur="validateField('title')"
        @input="onTitleInput"
        :border-bottom="false"
        placeholder="请输入标题"
        :class="{ 'has-error': hasError('title') }"
      />
      <!-- TODO: 实现错误提示组件 -->
      <ValidationMessage
        :field="'title'"
        :errors="validationState.errors"
      />
    </view>
    
    <!-- 内容输入 -->
    <view class="field-group">
      <!-- TODO: 集成富文本编辑器验证 -->
    </view>
    
    <!-- 分类选择验证 -->
    <view class="field-group">
      <!-- TODO: 集成分类选择验证 -->
    </view>
  </view>
</template>

<script setup lang="ts">
// TODO: 实现组件验证逻辑
const formData = reactive({
  title: '',
  content: '',
  category: null,
  location: null
})

const validator = new FormValidator()
const validationState = reactive<FormValidationState>({
  // 初始状态
})

// 实时验证方法
const validateField = (field: string) => {
  // TODO: 实现字段验证
}

const onTitleInput = debounce((value: string) => {
  // TODO: 实现输入时验证
}, 300)
</script>
```

### 错误提示组件
```vue
<!-- components/ValidationMessage.vue -->
<template>
  <view class="validation-message">
    <!-- 错误信息 -->
    <view
      v-for="error in errors[field]"
      :key="error"
      class="error-message"
    >
      <!-- TODO: 实现错误提示样式和动画 -->
      <u-icon name="error-circle" color="#ff4757" size="16" />
      <text class="error-text">{{ error }}</text>
    </view>
    
    <!-- 警告信息 -->
    <view 
      v-for="warning in warnings[field]"
      :key="warning"
      class="warning-message"
    >
      <!-- TODO: 实现警告提示样式 -->
      <u-icon name="warning" color="#ffa502" size="16" />
      <text class="warning-text">{{ warning }}</text>
    </view>
  </view>
</template>
```

## 业务规则验证

### 内容审核规则
```typescript
// rules/contentRules.ts
export const contentValidationRules = {
  // TODO: 实现内容审核相关规则
  
  // 敏感词检查
  sensitiveWords: (content: string): boolean => {
    // 敏感词过滤逻辑
  },
  
  // 垃圾信息检测
  spamDetection: (content: string): boolean => {
    // 垃圾信息检测逻辑
  },
  
  // 图片内容检查
  imageContentCheck: (images: string[]): Promise<boolean> => {
    // 图片内容合规性检查
  }
}
```

### 社区规范验证
```typescript
// rules/communityRules.ts
export const communityValidationRules = {
  // TODO: 实现社区规范相关验证
  
  // 发布频率限制
  postFrequencyLimit: (userId: string): Promise<boolean> => {
    // 检查用户发布频率
  },
  
  // 分类内容匹配度
  categoryContentMatch: (category: string, content: string): boolean => {
    // 内容与分类的匹配度检查
  }
}
```

## 服务端验证集成

### API 验证接口
```typescript
// api/validation.ts
export const validatePostData = async (postData: PostData): Promise<ValidationResult> => {
  // TODO: 实现服务端验证API调用
  try {
    const response = await fetch('/api/posts/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    })
    return await response.json()
  } catch (error) {
    // 验证失败处理
  }
}
```

### Directus 验证集成
```typescript
// services/directusValidation.ts
export const directusValidation = {
  // TODO: 集成 Directus 数据验证
  
  validatePostStructure: async (data: any): Promise<boolean> => {
    // 验证数据结构是否符合 Directus schema
  },
  
  checkUserPermissions: async (userId: string, action: string): Promise<boolean> => {
    // 检查用户操作权限
  }
}
```

## 验收标准

### 功能验收
- [ ] 所有字段实时验证正常工作
- [ ] 错误提示信息准确且友好
- [ ] 提交前完整性验证生效
- [ ] 服务端验证正确集成
- [ ] 业务规则验证符合预期
- [ ] 验证状态管理正确

### 用户体验验收
- [ ] 验证反馈及时（< 500ms）
- [ ] 错误提示位置合理
- [ ] 验证不影响正常输入体验
- [ ] 错误状态清除及时
- [ ] 多语言支持（如需要）

### 性能验收
- [ ] 实时验证不影响输入响应
- [ ] 大量验证规则执行效率良好
- [ ] 内存占用合理
- [ ] 验证结果缓存有效

## 状态管理集成

### Pinia Store 设计
```typescript
// store/validation.ts
export const useValidationStore = defineStore('validation', {
  state: (): FormValidationState => ({
    // TODO: 实现验证状态管理
    rules: [],
    errors: {},
    warnings: {},
    isValidating: false,
    hasValidated: false
  }),
  
  actions: {
    async validateForm(data: Record<string, any>): Promise<ValidationResult> {
      // 表单验证action
    },
    
    clearValidation(): void {
      // 清除验证状态
    },
    
    setFieldError(field: string, errors: string[]): void {
      // 设置字段错误
    }
  },
  
  getters: {
    isFormValid(): boolean {
      // 表单是否有效
    },
    
    hasAnyError(): boolean {
      // 是否有任何错误
    }
  }
})
```

## 开发注意事项

### 性能优化
- 验证规则执行优化
- 防抖处理输入验证
- 异步验证合并处理
- 验证结果缓存机制

### 用户体验
- 渐进式错误提示
- 非阻塞式警告信息
- 智能验证触发时机
- 清晰的成功状态反馈

### 国际化支持
- 错误信息多语言
- 验证规则本地化
- 文化差异考虑

## 测试要求

### 单元测试
```typescript
// tests/validator.spec.ts
describe('FormValidator', () => {
  // TODO: 编写验证器单元测试
  
  it('should validate required fields', () => {
    // 必填项验证测试
  })
  
  it('should validate field length', () => {
    // 长度验证测试
  })
  
  it('should execute custom validators', () => {
    // 自定义验证器测试
  })
})
```

### 集成测试
- [ ] 表单提交验证流程测试
- [ ] 与其他模块集成测试
- [ ] API 验证接口测试
- [ ] 状态管理集成测试

### 用户场景测试
- [ ] 正常输入场景测试
- [ ] 异常输入处理测试
- [ ] 网络异常时验证行为测试
- [ ] 并发验证场景测试

## 开发人员填写区域

### 验证框架选择
```
TODO: 记录验证框架或方案的选择
选择: [ ] 自定义验证器 [ ] Joi [ ] Yup [ ] VeeValidate [ ] 其他
原因: 
优缺点分析:
```

### 验证规则配置
```
TODO: 记录具体的验证规则配置
业务规则数量: 
技术验证规则数量:
自定义规则数量:
```

### 实现进度记录
- [ ] 核心验证器开发
- [ ] 验证规则配置
- [ ] 实时验证集成
- [ ] 错误提示组件
- [ ] 服务端验证集成
- [ ] 状态管理集成
- [ ] 测试用例编写

### 技术问题记录
```
TODO: 开发过程中遇到的验证相关问题
问题1: 实时验证性能优化
解决方案:

问题2: 复杂业务规则实现
解决方案:

问题3: 异步验证处理
解决方案:
```

### 测试执行结果
```
TODO: 各类测试的执行结果
单元测试: [通过/失败] - 覆盖率: %
集成测试: [通过/失败] - 测试场景数量:
用户测试: [通过/失败] - 反馈问题:
```