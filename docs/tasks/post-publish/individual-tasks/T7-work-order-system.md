# T7: 工单系统集成开发

## 任务概述
实现内容发布的工单流程管理，包括工单创建、状态跟踪、审核流程和通知机制，确保内容发布的规范化管理。

## 技术要求
- **框架**: Vue 3 + TypeScript + uni-app
- **工单引擎**: Directus workflows 或自定义工单系统
- **状态管理**: Pinia
- **依赖**: T1-T6 完成后集成

## 功能规格

### 工单流程
1. **内容提交**: 用户完成内容创作后提交工单
2. **自动审核**: 系统自动检查基础规范
3. **人工审核**: 需要时进入人工审核流程
4. **状态跟踪**: 实时显示工单处理状态
5. **结果通知**: 审核完成后通知用户

### 工单状态
- `pending`: 待处理
- `auto_reviewing`: 自动审核中
- `manual_reviewing`: 人工审核中
- `approved`: 已通过
- `rejected`: 已拒绝
- `published`: 已发布

## 开发指导

### 数据结构设计
```typescript
// types/workOrder.ts
interface WorkOrder {
  id: string
  postId: string
  userId: string
  title: string
  content: string
  metadata: {
    category: string
    tags: string[]
    location: Location | null
    images: string[]
  }
  status: WorkOrderStatus
  priority: 'low' | 'normal' | 'high' | 'urgent'
  createdAt: Date
  updatedAt: Date
  submittedAt: Date | null
  reviewedAt: Date | null
  publishedAt: Date | null
  reviewer?: {
    id: string
    name: string
    comment: string
  }
  autoReviewResults?: AutoReviewResult[]
  rejectionReason?: string
  estimatedProcessTime?: number
}

interface AutoReviewResult {
  rule: string
  passed: boolean
  score: number
  message: string
  suggestion?: string
}

type WorkOrderStatus = 'pending' | 'auto_reviewing' | 'manual_reviewing' | 'approved' | 'rejected' | 'published'
```

### 工单服务核心类
```typescript
// services/workOrderService.ts
class WorkOrderService {
  // TODO: 实现工单服务核心功能
  
  async createWorkOrder(postData: PostData): Promise<WorkOrder> {
    // 创建工单
    const workOrder: WorkOrder = {
      id: generateId(),
      postId: postData.id,
      userId: getCurrentUserId(),
      title: postData.title,
      content: postData.content,
      metadata: {
        category: postData.category,
        tags: postData.tags,
        location: postData.location,
        images: postData.images
      },
      status: 'pending',
      priority: this.calculatePriority(postData),
      createdAt: new Date(),
      updatedAt: new Date(),
      submittedAt: new Date()
    }
    
    // 保存到数据库
    await this.saveWorkOrder(workOrder)
    
    // 触发自动审核
    await this.triggerAutoReview(workOrder.id)
    
    return workOrder
  }
  
  async getWorkOrderStatus(workOrderId: string): Promise<WorkOrder> {
    // 获取工单状态
  }
  
  async getUserWorkOrders(userId: string): Promise<WorkOrder[]> {
    // 获取用户工单列表
  }
  
  async updateWorkOrderStatus(
    workOrderId: string,
    status: WorkOrderStatus,
    comment?: string
  ): Promise<WorkOrder> {
    // 更新工单状态
  }
  
  private calculatePriority(postData: PostData): 'low' | 'normal' | 'high' | 'urgent' {
    // TODO: 根据内容类型和用户等级计算优先级
  }
  
  private async triggerAutoReview(workOrderId: string): Promise<void> {
    // TODO: 触发自动审核流程
  }
}
```

### 自动审核引擎
```typescript
// services/autoReviewEngine.ts
class AutoReviewEngine {
  private rules: ReviewRule[] = []
  
  // TODO: 实现自动审核引擎
  
  async reviewWorkOrder(workOrder: WorkOrder): Promise<AutoReviewResult[]> {
    const results: AutoReviewResult[] = []
    
    for (const rule of this.rules) {
      const result = await this.executeRule(rule, workOrder)
      results.push(result)
    }
    
    return results
  }
  
  private async executeRule(rule: ReviewRule, workOrder: WorkOrder): Promise<AutoReviewResult> {
    // TODO: 执行具体审核规则
    try {
      const passed = await rule.validator(workOrder)
      return {
        rule: rule.name,
        passed,
        score: passed ? rule.passScore : rule.failScore,
        message: passed ? rule.passMessage : rule.failMessage,
        suggestion: passed ? undefined : rule.suggestion
      }
    } catch (error) {
      return {
        rule: rule.name,
        passed: false,
        score: 0,
        message: `审核规则执行失败: ${error.message}`
      }
    }
  }
  
  registerRule(rule: ReviewRule): void {
    this.rules.push(rule)
  }
}

interface ReviewRule {
  name: string
  description: string
  validator: (workOrder: WorkOrder) => Promise<boolean>
  passScore: number
  failScore: number
  passMessage: string
  failMessage: string
  suggestion?: string
}
```

## 审核规则配置

### 基础审核规则
```typescript
// config/reviewRules.ts
export const AUTO_REVIEW_RULES: ReviewRule[] = [
  // TODO: 配置具体的审核规则
  {
    name: 'content_length_check',
    description: '内容长度检查',
    validator: async (workOrder) => {
      const content = workOrder.content.trim()
      return content.length >= 10 && content.length <= 5000
    },
    passScore: 10,
    failScore: -5,
    passMessage: '内容长度符合要求',
    failMessage: '内容长度不符合要求（10-5000字符）',
    suggestion: '请调整内容长度到合适范围'
  },
  
  {
    name: 'sensitive_content_check',
    description: '敏感内容检查',
    validator: async (workOrder) => {
      // TODO: 实现敏感内容检测逻辑
      return await checkSensitiveContent(workOrder.content)
    },
    passScore: 20,
    failScore: -50,
    passMessage: '内容健康，未发现敏感信息',
    failMessage: '内容包含敏感信息',
    suggestion: '请修改敏感内容后重新提交'
  },
  
  {
    name: 'image_compliance_check',
    description: '图片合规性检查',
    validator: async (workOrder) => {
      if (workOrder.metadata.images.length === 0) return true
      return await checkImageCompliance(workOrder.metadata.images)
    },
    passScore: 15,
    failScore: -30,
    passMessage: '图片内容合规',
    failMessage: '图片内容不合规',
    suggestion: '请更换合规的图片'
  },
  
  {
    name: 'spam_detection',
    description: '垃圾信息检测',
    validator: async (workOrder) => {
      return await detectSpamContent(workOrder.content, workOrder.metadata)
    },
    passScore: 15,
    failScore: -40,
    passMessage: '内容质量良好',
    failMessage: '检测到疑似垃圾信息',
    suggestion: '请提供更有价值的内容'
  }
]
```

### 业务规则配置
```typescript
// config/businessRules.ts
export const BUSINESS_REVIEW_RULES: ReviewRule[] = [
  // TODO: 配置业务相关审核规则
  {
    name: 'category_content_match',
    description: '分类内容匹配度检查',
    validator: async (workOrder) => {
      return await checkCategoryContentMatch(
        workOrder.metadata.category,
        workOrder.content
      )
    },
    passScore: 10,
    failScore: -10,
    passMessage: '内容与分类匹配',
    failMessage: '内容与选择的分类不匹配',
    suggestion: '请选择更合适的分类或调整内容'
  }
]
```

## 工单状态跟踪

### 状态跟踪组件
```vue
<!-- components/WorkOrderStatus.vue -->
<template>
  <view class="work-order-status">
    <!-- 状态进度条 -->
    <view class="status-progress">
      <!-- TODO: 实现状态进度条UI -->
      <view 
        v-for="(step, index) in statusSteps" 
        :key="step.status"
        class="progress-step"
        :class="{
          'completed': isStepCompleted(step.status),
          'current': currentStatus === step.status,
          'failed': isStepFailed(step.status)
        }"
      >
        <view class="step-icon">
          <u-icon :name="step.icon" :color="getStepColor(step.status)" />
        </view>
        <view class="step-label">{{ step.label }}</view>
        <view class="step-time" v-if="getStepTime(step.status)">
          {{ formatTime(getStepTime(step.status)) }}
        </view>
      </view>
    </view>
    
    <!-- 当前状态详情 -->
    <view class="status-detail">
      <!-- TODO: 实现状态详情显示 -->
      <view class="current-status">
        <text class="status-text">{{ getCurrentStatusText() }}</text>
        <text class="estimated-time" v-if="estimatedProcessTime">
          预计处理时间: {{ formatDuration(estimatedProcessTime) }}
        </text>
      </view>
      
      <!-- 审核结果 -->
      <view class="review-results" v-if="autoReviewResults?.length">
        <view class="results-title">自动审核结果</view>
        <view 
          v-for="result in autoReviewResults"
          :key="result.rule"
          class="result-item"
          :class="{ 'passed': result.passed, 'failed': !result.passed }"
        >
          <u-icon 
            :name="result.passed ? 'checkmark-circle' : 'close-circle'" 
            :color="result.passed ? '#19be6b' : '#fa3534'" 
          />
          <text class="result-message">{{ result.message }}</text>
          <text class="result-suggestion" v-if="result.suggestion">
            {{ result.suggestion }}
          </text>
        </view>
      </view>
      
      <!-- 拒绝原因 -->
      <view class="rejection-reason" v-if="workOrder.status === 'rejected'">
        <view class="reason-title">拒绝原因</view>
        <text class="reason-text">{{ workOrder.rejectionReason }}</text>
      </view>
    </view>
    
    <!-- 操作按钮 -->
    <view class="action-buttons">
      <!-- TODO: 实现操作按钮 -->
      <u-button 
        v-if="canResubmit"
        type="primary"
        @click="resubmitWorkOrder"
      >
        重新提交
      </u-button>
      
      <u-button 
        v-if="canCancel"
        type="default"
        @click="cancelWorkOrder"
      >
        取消工单
      </u-button>
    </view>
  </view>
</template>
```

### 实时状态更新
```typescript
// hooks/useWorkOrderTracking.ts
export const useWorkOrderTracking = (workOrderId: string) => {
  const workOrderStore = useWorkOrderStore()
  const workOrder = ref<WorkOrder | null>(null)
  
  // TODO: 实现工单状态实时跟踪
  
  const startTracking = () => {
    // 启动轮询或WebSocket连接
    const timer = setInterval(async () => {
      try {
        const updatedWorkOrder = await workOrderService.getWorkOrderStatus(workOrderId)
        workOrder.value = updatedWorkOrder
        
        // 状态变化通知
        if (updatedWorkOrder.status !== workOrder.value?.status) {
          notifyStatusChange(updatedWorkOrder.status)
        }
      } catch (error) {
        console.error('工单状态更新失败:', error)
      }
    }, 30000) // 30秒轮询一次
    
    onUnmounted(() => {
      clearInterval(timer)
    })
  }
  
  const notifyStatusChange = (newStatus: WorkOrderStatus) => {
    // TODO: 实现状态变化通知
    const statusMessages = {
      'auto_reviewing': '您的内容正在自动审核中...',
      'manual_reviewing': '您的内容已进入人工审核阶段',
      'approved': '恭喜！您的内容已通过审核',
      'rejected': '很抱歉，您的内容未通过审核',
      'published': '您的内容已成功发布'
    }
    
    uni.showToast({
      title: statusMessages[newStatus] || '工单状态已更新',
      icon: newStatus === 'approved' || newStatus === 'published' ? 'success' : 'none'
    })
  }
  
  return {
    workOrder,
    startTracking
  }
}
```

## 通知系统集成

### 推送通知配置
```typescript
// services/notificationService.ts
class NotificationService {
  // TODO: 实现通知服务
  
  async sendWorkOrderNotification(
    userId: string,
    workOrderId: string,
    type: 'status_change' | 'review_complete' | 'published',
    data: any
  ): Promise<void> {
    // 发送推送通知
    try {
      // uni-app 推送通知
      await uni.requestSubscribeMessage({
        tmplIds: [this.getTemplateId(type)],
        success: (res) => {
          if (res[this.getTemplateId(type)] === 'accept') {
            this.sendTemplateMessage(userId, type, data)
          }
        }
      })
    } catch (error) {
      console.error('推送通知失败:', error)
    }
  }
  
  private getTemplateId(type: string): string {
    // TODO: 返回对应的模板消息ID
    const templateIds = {
      'status_change': 'template_id_1',
      'review_complete': 'template_id_2',
      'published': 'template_id_3'
    }
    return templateIds[type] || ''
  }
  
  private async sendTemplateMessage(userId: string, type: string, data: any): Promise<void> {
    // TODO: 发送模板消息
  }
}
```

## API 集成

### Directus 工单管理
```typescript
// api/workOrders.ts
export const workOrderApi = {
  // TODO: 实现工单相关API
  
  async createWorkOrder(workOrder: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkOrder> {
    const response = await directus.items('work_orders').createOne({
      ...workOrder,
      created_at: new Date(),
      updated_at: new Date()
    })
    return response
  },
  
  async updateWorkOrderStatus(
    workOrderId: string, 
    status: WorkOrderStatus, 
    comment?: string
  ): Promise<WorkOrder> {
    const response = await directus.items('work_orders').updateOne(workOrderId, {
      status,
      reviewer_comment: comment,
      updated_at: new Date(),
      reviewed_at: status === 'approved' || status === 'rejected' ? new Date() : undefined
    })
    return response
  },
  
  async getWorkOrder(workOrderId: string): Promise<WorkOrder> {
    const response = await directus.items('work_orders').readOne(workOrderId, {
      fields: ['*', 'user.id', 'user.name', 'user.avatar']
    })
    return response
  },
  
  async getUserWorkOrders(userId: string): Promise<WorkOrder[]> {
    const response = await directus.items('work_orders').readByQuery({
      filter: { user: { _eq: userId } },
      sort: ['-created_at'],
      limit: 50
    })
    return response.data || []
  }
}
```

## 验收标准

### 功能验收
- [ ] 工单创建流程正常
- [ ] 自动审核规则生效
- [ ] 状态跟踪准确显示
- [ ] 审核结果正确反馈
- [ ] 通知推送及时到达
- [ ] 人工审核流程完整
- [ ] 工单列表管理正常

### 性能验收
- [ ] 工单处理响应时间 < 3秒
- [ ] 自动审核执行时间 < 10秒
- [ ] 状态轮询不影响用户体验
- [ ] 大量工单时系统稳定

### 业务验收
- [ ] 审核规则覆盖完整
- [ ] 工单优先级计算准确
- [ ] 状态流转逻辑正确
- [ ] 异常情况处理完善

## 开发注意事项

### 工单流程设计
- 状态流转的单向性保证
- 并发处理的数据一致性
- 异常情况的回滚机制
- 审核规则的可扩展性

### 性能优化
- 自动审核的异步处理
- 状态查询的缓存策略
- 批量工单的处理优化
- 数据库查询性能优化

### 安全考虑
- 工单数据的访问权限控制
- 审核规则的安全性验证
- 用户身份的验证和授权
- 敏感数据的加密存储

## 测试要求

### 功能测试
- [ ] 工单创建和提交测试
- [ ] 自动审核规则测试
- [ ] 状态流转测试
- [ ] 通知推送测试
- [ ] 工单管理操作测试

### 业务流程测试
- [ ] 正常审核通过流程
- [ ] 审核拒绝和重新提交流程
- [ ] 人工审核介入流程
- [ ] 紧急工单处理流程

### 性能测试
- [ ] 大量工单并发处理
- [ ] 复杂审核规则执行效率
- [ ] 长时间运行稳定性测试

## 开发人员填写区域

### 工单引擎选择
```
TODO: 记录工单系统的技术选择
选择: [ ] Directus Workflows [ ] 自定义工单系统 [ ] 第三方工单服务
原因: 
集成复杂度: 
可扩展性: 
```

### 审核规则配置
```
TODO: 记录配置的审核规则详情
自动审核规则数量: 
业务规则数量: 
规则执行顺序: 
失败阈值设置: 
```

### 开发进度记录
- [ ] 工单数据结构设计
- [ ] 核心服务类开发
- [ ] 自动审核引擎实现
- [ ] 状态跟踪组件开发
- [ ] 通知系统集成
- [ ] API接口开发
- [ ] 测试用例编写

### 技术难点记录
```
TODO: 开发过程中的技术挑战
挑战1: 复杂审核规则的性能优化
解决方案:

挑战2: 工单状态的并发一致性
解决方案:

挑战3: 实时通知的可靠性保证
解决方案:
```

### 测试执行结果
```
TODO: 测试执行结果记录
功能测试: [通过/失败] - 工单流程完整性:
性能测试: [通过/失败] - 平均处理时间: 秒
业务测试: [通过/失败] - 审核准确率: %
```