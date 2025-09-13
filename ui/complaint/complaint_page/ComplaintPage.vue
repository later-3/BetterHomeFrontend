<template>
  <div class="complaint-page">
    <!-- 状态栏 -->
    <div class="status-bar">
      <div class="time">{{ currentTime }}</div>
      <div class="status-icons">
        <div class="signal-icon">📶</div>
        <div class="wifi-icon">📶</div>
        <div class="battery-icon">🔋</div>
      </div>
    </div>

    <!-- 页面头部 -->
    <div class="page-header">
      <button class="back-btn" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="page-title">代办事项</h1>
      <button class="menu-btn" @click="showMenu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="1" stroke="currentColor" stroke-width="2"/>
          <circle cx="19" cy="12" r="1" stroke="currentColor" stroke-width="2"/>
          <circle cx="5" cy="12" r="1" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>
    </div>

    <!-- 筛选和统计 -->
    <div class="filter-section">
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-number">{{ totalTasks }}</span>
          <span class="stat-label">总计</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ pendingTasks }}</span>
          <span class="stat-label">待处理</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ urgentTasks }}</span>
          <span class="stat-label">紧急</span>
        </div>
      </div>
      
      <div class="filter-tabs">
        <button 
          v-for="filter in filters" 
          :key="filter.key"
          :class="['filter-tab', { active: activeFilter === filter.key }]"
          @click="setActiveFilter(filter.key)"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="tasks-container">
      <div class="tasks-list">
        <TaskCard
          v-for="task in filteredTasks"
          :key="task.id"
          :task="task"
          @click="handleTaskClick(task)"
          @status-change="handleStatusChange"
        />
      </div>
      
      <!-- 空状态 -->
      <div v-if="filteredTasks.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <p class="empty-text">暂无{{ activeFilterLabel }}事项</p>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="bottom-actions">
      <button class="add-task-btn" @click="addNewTask">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2"/>
          <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2"/>
        </svg>
        <span>新建事项</span>
      </button>
    </div>

    <!-- Home指示器 -->
    <div class="home-indicator"></div>
  </div>
</template>

<script>
import TaskCard from '../card/TaskCard.vue'

export default {
  name: 'ComplaintPage',
  components: {
    TaskCard
  },
  data() {
    return {
      currentTime: '9:41',
      activeFilter: 'all',
      filters: [
        { key: 'all', label: '全部' },
        { key: 'pending', label: '待处理' },
        { key: 'urgent', label: '紧急' },
        { key: 'completed', label: '已完成' }
      ],
      tasks: [
        {
          id: 1,
          title: '电梯维修申请',
          description: '3号楼电梯经常卡顿，需要专业维修人员检查。已经影响到住户正常出行，希望尽快处理。',
          category: '设施维修',
          priority: '紧急',
          status: '待处理',
          location: '3号楼电梯间',
          assignee: {
            name: '张师傅',
            role: '维修部门',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang'
          },
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2小时前
        },
        {
          id: 2,
          title: '噪音投诉处理',
          description: '楼上住户深夜装修，严重影响休息。希望物业能够协调处理，维护小区安静环境。',
          category: '投诉建议',
          priority: '重要',
          status: '处理中',
          location: '5号楼2单元',
          assignee: {
            name: '李管家',
            role: '客服部门',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li'
          },
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5天前
        },
        {
          id: 3,
          title: '门禁系统故障',
          description: '小区南门门禁卡无法正常使用，给住户进出带来不便，需要技术人员维修。',
          category: '安全问题',
          priority: '紧急',
          status: '待处理',
          location: '小区南门',
          assignee: {
            name: '王工程师',
            role: '技术部门',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang'
          },
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1天前
        },
        {
          id: 4,
          title: '垃圾清理建议',
          description: '小区垃圾桶经常满溢，建议增加清理频次或增设垃圾桶，保持环境整洁。',
          category: '环境卫生',
          priority: '普通',
          status: '已完成',
          location: '小区中央花园',
          assignee: {
            name: '陈主管',
            role: '环卫部门',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chen'
          },
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3天前
        },
        {
          id: 5,
          title: '停车位纠纷',
          description: '业主之间因为停车位使用产生争议，需要物业介入协调解决。',
          category: '邻里纠纷',
          priority: '重要',
          status: '处理中',
          location: '地下停车场B区',
          assignee: {
            name: '赵经理',
            role: '物业管理',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhao'
          },
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7天前
        },
        {
          id: 6,
          title: '公共设施改善',
          description: '建议在小区增设儿童游乐设施，丰富小朋友的娱乐活动空间。',
          category: '其他事项',
          priority: '低',
          status: '待处理',
          location: '小区中央广场',
          assignee: {
            name: '孙主任',
            role: '规划部门',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sun'
          },
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10天前
        }
      ]
    }
  },
  computed: {
    filteredTasks() {
      if (this.activeFilter === 'all') {
        return this.tasks
      } else if (this.activeFilter === 'pending') {
        return this.tasks.filter(task => task.status === '待处理')
      } else if (this.activeFilter === 'urgent') {
        return this.tasks.filter(task => task.priority === '紧急')
      } else if (this.activeFilter === 'completed') {
        return this.tasks.filter(task => task.status === '已完成')
      }
      return this.tasks
    },
    activeFilterLabel() {
      const filter = this.filters.find(f => f.key === this.activeFilter)
      return filter ? filter.label : '全部'
    },
    totalTasks() {
      return this.tasks.length
    },
    pendingTasks() {
      return this.tasks.filter(task => task.status === '待处理').length
    },
    urgentTasks() {
      return this.tasks.filter(task => task.priority === '紧急').length
    }
  },
  methods: {
    setActiveFilter(filterKey) {
      this.activeFilter = filterKey
    },
    handleTaskClick(task) {
      console.log('点击任务:', task.title)
      // 这里可以触发事件给父组件处理
      this.$emit('task-click', task)
    },
    handleStatusChange(taskId, newStatus) {
      const task = this.tasks.find(t => t.id === taskId)
      if (task) {
        task.status = newStatus
      }
    },
    goBack() {
      console.log('返回上一页')
      this.$emit('go-back')
    },
    showMenu() {
      console.log('显示菜单')
      this.$emit('show-menu')
    },
    addNewTask() {
      console.log('新建任务')
      this.$emit('add-task')
    },
    updateTime() {
      const now = new Date()
      this.currentTime = now.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    }
  },
  mounted() {
    this.updateTime()
    // 每分钟更新一次时间
    setInterval(this.updateTime, 60000)
  },
  emits: ['task-click', 'go-back', 'show-menu', 'add-task']
}
</script>

<style scoped>
.complaint-page {
  width: 375px;
  min-height: 812px;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative;
  overflow: hidden;
}

/* 状态栏 */
.status-bar {
  height: 44px;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  font-size: 15px;
  font-weight: 600;
  color: #000;
}

.status-icons {
  display: flex;
  gap: 5px;
  font-size: 12px;
}

/* 页面头部 */
.page-header {
  height: 56px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #e9ecef;
}

.back-btn, .menu-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  color: #495057;
}

.back-btn:hover, .menu-btn:hover {
  background: #f8f9fa;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #212529;
  margin: 0;
}

/* 筛选和统计 */
.filter-section {
  background: white;
  padding: 16px;
  border-bottom: 1px solid #e9ecef;
}

.stats-row {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #495057;
}

.stat-label {
  font-size: 12px;
  color: #6c757d;
}

.filter-tabs {
  display: flex;
  gap: 8px;
}

.filter-tab {
  padding: 8px 16px;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 20px;
  font-size: 14px;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-tab.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.filter-tab:hover:not(.active) {
  background: #f8f9fa;
}

/* 任务列表 */
.tasks-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  margin: 0;
}

/* 底部操作栏 */
.bottom-actions {
  background: white;
  padding: 16px;
  border-top: 1px solid #e9ecef;
}

.add-task-btn {
  width: 100%;
  height: 48px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.add-task-btn:hover {
  background: #0056b3;
}

/* Home指示器 */
.home-indicator {
  height: 34px;
  background: white;
  display: flex;
  justify-content: center;
  align-items: center;
}

.home-indicator::after {
  content: '';
  width: 134px;
  height: 5px;
  background: #000;
  border-radius: 3px;
  opacity: 0.3;
}

/* 响应式调整 */
@media (max-width: 375px) {
  .complaint-page {
    width: 100%;
  }
}

/* 滚动条样式 */
.tasks-container::-webkit-scrollbar {
  width: 4px;
}

.tasks-container::-webkit-scrollbar-track {
  background: transparent;
}

.tasks-container::-webkit-scrollbar-thumb {
  background: #dee2e6;
  border-radius: 2px;
}

.tasks-container::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}
</style>