# T6: 草稿管理系统开发

## 任务概述
实现完整的草稿管理功能，包括自动保存、草稿列表、版本管理和恢复机制，提供无缝的内容创作体验。

## 技术要求
- **框架**: Vue 3 + TypeScript + uni-app
- **存储**: 本地存储 + Directus 云端同步
- **状态管理**: Pinia
- **依赖**: 与 T1-T5 集成，需要所有表单数据

## 功能规格

### 核心功能
1. **自动保存**: 编辑时定时保存草稿
2. **手动保存**: 用户主动保存草稿
3. **草稿列表**: 显示所有草稿及管理
4. **版本管理**: 草稿历史版本记录
5. **离线支持**: 网络异常时本地保存
6. **数据恢复**: 意外退出后数据恢复

### 保存策略
- **自动保存间隔**: 30秒或内容变更时
- **本地优先**: 先保存本地，再同步云端
- **冲突解决**: 本地与云端数据冲突处理

## 开发指导

### 数据结构设计
```typescript
// types/draft.ts
interface DraftData {
  id: string
  title: string
  content: string
  images: string[]
  category: {
    main: string | null
    sub: string | null
  }
  tags: string[]
  location: Location | null
  createdAt: Date
  updatedAt: Date
  version: number
  status: 'draft' | 'auto-saved' | 'synced'
  wordCount: number
  imageCount: number
}

interface DraftVersion {
  id: string
  draftId: string
  version: number
  data: DraftData
  createdAt: Date
  changeDescription?: string
}

interface DraftState {
  drafts: DraftData[]
  currentDraft: DraftData | null
  isAutoSaving: boolean
  lastSaveTime: Date | null
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error'
}
```

### 核心服务类设计
```typescript
// services/draftService.ts
class DraftService {
  private autoSaveInterval: number = 30000 // 30秒
  private saveTimer: NodeJS.Timeout | null = null
  
  // TODO: 实现草稿服务核心方法
  
  async saveDraft(draftData: Partial<DraftData>): Promise<DraftData> {
    // 保存草稿（本地+云端）
  }
  
  async autoSaveDraft(draftData: Partial<DraftData>): Promise<void> {
    // 自动保存逻辑
  }
  
  async loadDrafts(): Promise<DraftData[]> {
    // 加载草稿列表
  }
  
  async deleteDraft(draftId: string): Promise<void> {
    // 删除草稿
  }
  
  async restoreDraft(draftId: string): Promise<DraftData> {
    // 恢复草稿到编辑器
  }
  
  startAutoSave(callback: () => DraftData): void {
    // 启动自动保存
  }
  
  stopAutoSave(): void {
    // 停止自动保存
  }
  
  async syncToCloud(draft: DraftData): Promise<void> {
    // 云端同步
  }
}
```

### 本地存储管理
```typescript
// utils/localDraftStorage.ts
class LocalDraftStorage {
  private readonly STORAGE_KEY = 'app_drafts'
  private readonly VERSION_KEY = 'app_draft_versions'
  
  // TODO: 实现本地存储管理
  
  async saveDraftLocal(draft: DraftData): Promise<void> {
    // 本地保存草稿
    const drafts = await this.getAllDrafts()
    const index = drafts.findIndex(d => d.id === draft.id)
    
    if (index >= 0) {
      drafts[index] = draft
    } else {
      drafts.push(draft)
    }
    
    await this.setStorageItem(this.STORAGE_KEY, drafts)
  }
  
  async getDrafts(): Promise<DraftData[]> {
    // 获取本地草稿列表
  }
  
  async deleteDraftLocal(draftId: string): Promise<void> {
    // 删除本地草稿
  }
  
  async saveVersion(version: DraftVersion): Promise<void> {
    // 保存版本记录
  }
  
  private async setStorageItem(key: string, data: any): Promise<void> {
    // uni-app 存储封装
  }
}
```

## 自动保存机制

### 触发条件
```typescript
// hooks/useAutoSave.ts
export const useAutoSave = (formData: Ref<DraftData>) => {
  const draftService = new DraftService()
  const { $toast } = getCurrentInstance()?.appContext.config.globalProperties
  
  // TODO: 实现自动保存逻辑
  
  const triggerAutoSave = debounce(async () => {
    try {
      await draftService.autoSaveDraft(formData.value)
      // 静默保存，不显示提示
    } catch (error) {
      console.error('自动保存失败:', error)
    }
  }, 1000)
  
  // 监听表单数据变化
  watchEffect(() => {
    if (formData.value.title || formData.value.content) {
      triggerAutoSave()
    }
  })
  
  // 页面离开时保存
  onUnmounted(() => {
    draftService.stopAutoSave()
  })
  
  return {
    manualSave: () => draftService.saveDraft(formData.value),
    lastSaveTime: computed(() => draftService.lastSaveTime)
  }
}
```

### 状态指示器
```vue
<!-- components/DraftStatus.vue -->
<template>
  <view class="draft-status">
    <!-- 保存状态指示 -->
    <view class="save-status" :class="statusClass">
      <!-- TODO: 实现状态指示器UI -->
      <u-icon :name="statusIcon" :color="statusColor" size="14" />
      <text class="status-text">{{ statusText }}</text>
      <text class="save-time" v-if="lastSaveTime">
        {{ formatTime(lastSaveTime) }}
      </text>
    </view>
    
    <!-- 手动保存按钮 -->
    <u-button 
      type="primary"
      size="mini"
      :loading="isManualSaving"
      @click="handleManualSave"
    >
      保存草稿
    </u-button>
  </view>
</template>

<script setup lang="ts">
// TODO: 实现状态组件逻辑
const props = defineProps<{
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error'
  isAutoSaving: boolean
  lastSaveTime: Date | null
}>()

const statusIcon = computed(() => {
  // 根据状态返回对应图标
})

const statusText = computed(() => {
  // 根据状态返回对应文本
})
</script>
```

## 草稿列表页面

### 列表页面结构
```vue
<!-- pages/drafts/drafts.vue -->
<template>
  <view class="drafts-page">
    <!-- 头部搜索 -->
    <view class="search-header">
      <!-- TODO: 实现草稿搜索功能 -->
      <u-search 
        v-model="searchKeyword"
        placeholder="搜索草稿..."
        @search="onSearch"
        @custom="onSearch"
      />
    </view>
    
    <!-- 草稿列表 -->
    <view class="draft-list">
      <view 
        v-for="draft in filteredDrafts" 
        :key="draft.id"
        class="draft-item"
        @click="editDraft(draft)"
      >
        <!-- TODO: 实现草稿项组件 -->
        <view class="draft-info">
          <view class="draft-title">{{ draft.title || '无标题' }}</view>
          <view class="draft-preview">{{ getContentPreview(draft.content) }}</view>
          <view class="draft-meta">
            <text class="update-time">{{ formatTime(draft.updatedAt) }}</text>
            <text class="word-count">{{ draft.wordCount }}字</text>
            <text class="image-count" v-if="draft.imageCount">
              {{ draft.imageCount }}图
            </text>
          </view>
        </view>
        
        <view class="draft-actions">
          <u-icon name="edit" @click.stop="editDraft(draft)" />
          <u-icon name="delete" @click.stop="deleteDraft(draft)" />
        </view>
      </view>
    </view>
    
    <!-- 空状态 -->
    <view class="empty-state" v-if="drafts.length === 0">
      <!-- TODO: 实现空状态UI -->
    </view>
  </view>
</template>
```

### 草稿管理功能
```typescript
// pages/drafts/drafts.ts
export default defineComponent({
  setup() {
    const draftStore = useDraftStore()
    const router = useRouter()
    
    // TODO: 实现草稿列表页面逻辑
    
    const drafts = computed(() => draftStore.drafts)
    const searchKeyword = ref('')
    
    const filteredDrafts = computed(() => {
      if (!searchKeyword.value) return drafts.value
      return drafts.value.filter(draft => 
        draft.title?.includes(searchKeyword.value) ||
        draft.content.includes(searchKeyword.value)
      )
    })
    
    const editDraft = async (draft: DraftData) => {
      // 加载草稿到编辑器
      await draftStore.setCurrentDraft(draft)
      router.push('/pages/create/create')
    }
    
    const deleteDraft = async (draft: DraftData) => {
      // 删除草稿确认
      const confirmed = await showConfirm('确定删除这份草稿吗？')
      if (confirmed) {
        await draftStore.deleteDraft(draft.id)
      }
    }
    
    onMounted(() => {
      draftStore.loadDrafts()
    })
    
    return {
      drafts,
      filteredDrafts,
      editDraft,
      deleteDraft
    }
  }
})
```

## 版本管理功能

### 版本比较
```typescript
// utils/versionDiff.ts
interface DiffResult {
  field: string
  oldValue: any
  newValue: any
  changeType: 'added' | 'removed' | 'modified'
}

export const generateDraftDiff = (
  oldDraft: DraftData, 
  newDraft: DraftData
): DiffResult[] => {
  // TODO: 实现草稿版本对比
  const diffs: DiffResult[] = []
  
  // 比较各个字段的变化
  if (oldDraft.title !== newDraft.title) {
    diffs.push({
      field: 'title',
      oldValue: oldDraft.title,
      newValue: newDraft.title,
      changeType: 'modified'
    })
  }
  
  // 比较其他字段...
  
  return diffs
}
```

## API 集成

### Directus 集成
```typescript
// api/drafts.ts
export const draftApi = {
  // TODO: 实现草稿相关API
  
  async saveDraftToCloud(draft: DraftData): Promise<DraftData> {
    const response = await directus.items('drafts').createOne({
      title: draft.title,
      content: draft.content,
      metadata: {
        images: draft.images,
        category: draft.category,
        tags: draft.tags,
        location: draft.location
      },
      version: draft.version,
      status: draft.status
    })
    return response
  },
  
  async getDraftsFromCloud(): Promise<DraftData[]> {
    const response = await directus.items('drafts').readByQuery({
      filter: { status: { _neq: 'published' } },
      sort: ['-updated_at'],
      limit: 50
    })
    return response.data || []
  },
  
  async updateDraftInCloud(draftId: string, updates: Partial<DraftData>): Promise<DraftData> {
    const response = await directus.items('drafts').updateOne(draftId, updates)
    return response
  },
  
  async deleteDraftFromCloud(draftId: string): Promise<void> {
    await directus.items('drafts').deleteOne(draftId)
  }
}
```

## 验收标准

### 功能验收
- [ ] 自动保存功能正常工作
- [ ] 手动保存响应及时
- [ ] 草稿列表正确显示
- [ ] 草稿编辑恢复正常
- [ ] 删除功能安全可靠
- [ ] 离线保存正常工作
- [ ] 云端同步数据一致

### 用户体验验收
- [ ] 保存状态清晰可见
- [ ] 操作响应流畅
- [ ] 数据永不丢失
- [ ] 网络异常时优雅降级
- [ ] 大量草稿时性能良好

### 数据安全验收
- [ ] 本地数据加密存储
- [ ] 云端同步安全可靠
- [ ] 版本冲突正确处理
- [ ] 数据恢复准确无误

## 状态管理集成

### Pinia Store 实现
```typescript
// store/draft.ts
export const useDraftStore = defineStore('draft', {
  state: (): DraftState => ({
    // TODO: 实现草稿状态管理
    drafts: [],
    currentDraft: null,
    isAutoSaving: false,
    lastSaveTime: null,
    syncStatus: 'synced'
  }),
  
  actions: {
    async saveDraft(draftData: Partial<DraftData>): Promise<DraftData> {
      // 保存草稿
    },
    
    async loadDrafts(): Promise<void> {
      // 加载草稿列表
    },
    
    async deleteDraft(draftId: string): Promise<void> {
      // 删除草稿
    },
    
    setCurrentDraft(draft: DraftData | null): void {
      // 设置当前编辑草稿
    }
  }
})
```

## 开发注意事项

### 性能优化
- 大文本内容的存储优化
- 版本历史数据压缩
- 列表懒加载支持
- 内存使用优化

### 数据一致性
- 本地与云端数据同步策略
- 冲突解决机制
- 数据完整性检查
- 异常恢复处理

### 用户体验
- 无感知的自动保存
- 清晰的保存状态提示
- 快速的草稿切换
- 便捷的管理操作

## 测试要求

### 功能测试
- [ ] 自动保存机制测试
- [ ] 手动保存功能测试
- [ ] 草稿CRUD操作测试
- [ ] 版本管理功能测试
- [ ] 离线保存测试
- [ ] 数据同步测试

### 异常场景测试
- [ ] 网络断开时的保存行为
- [ ] 应用异常退出时的数据保护
- [ ] 存储空间不足时的处理
- [ ] 大量草稿时的性能表现

### 数据安全测试
- [ ] 数据加密存储测试
- [ ] 同步冲突处理测试
- [ ] 数据恢复准确性测试

## 开发人员填写区域

### 存储方案选择
```
TODO: 记录草稿存储方案的选择
本地存储: [ ] uni.setStorage [ ] SQLite [ ] IndexedDB
云端存储: [ ] Directus [ ] 自建API [ ] 其他
同步策略: [ ] 实时同步 [ ] 定时同步 [ ] 手动同步
```

### 自动保存配置
```
TODO: 记录自动保存的具体配置
保存间隔: 秒
触发条件: 
保存策略: 
版本保留数量: 
```

### 开发进度记录
- [ ] 核心数据结构设计
- [ ] 本地存储实现
- [ ] 自动保存机制
- [ ] 草稿列表页面
- [ ] 版本管理功能
- [ ] 云端同步集成
- [ ] 状态管理集成
- [ ] 测试用例编写

### 技术挑战记录
```
TODO: 开发过程中的技术挑战和解决方案
挑战1: 大量草稿的性能优化
解决方案:

挑战2: 数据同步冲突处理
解决方案:

挑战3: 离线数据一致性保证
解决方案:
```

### 测试执行记录
```
TODO: 各项测试的执行结果
功能测试: [通过/失败] - 测试用例数:
性能测试: [通过/失败] - 草稿数量: 响应时间:
数据安全测试: [通过/失败] - 安全项检查:
```