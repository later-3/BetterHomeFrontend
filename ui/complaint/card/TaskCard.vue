<template>
  <div class="task-card">
    <!-- Header Section -->
    <div class="header-section">
      <div class="task-info">
        <div class="task-type-badge" :class="typeClass">
          <img :src="typeIcon" alt="Type Icon" class="type-icon" />
          <span class="type-text">{{ task.type }}</span>
        </div>
        <div class="task-priority" :class="priorityClass">{{ task.priority }}</div>
      </div>
      <div class="time-info">
        <img src="assets/2.svg" alt="Time Icon" class="time-icon" />
        <span class="time-text">{{ formatTime(task.createdAt) }}</span>
      </div>
    </div>

    <!-- Content Section -->
    <div class="content-section">
      <h3 class="task-title">{{ task.title }}</h3>
      <p class="task-description">{{ task.description }}</p>
      
      <!-- Status and Location -->
      <div class="task-meta">
        <div class="status-badge" :class="statusClass">
          {{ task.status }}
        </div>
        <div class="location-info">
          <span class="location-text">{{ task.location }}</span>
        </div>
      </div>

      <!-- Assignee Info -->
      <div class="assignee-section">
        <div class="assignee-avatar">
          <img :src="task.assignee.avatar" :alt="task.assignee.name" class="avatar-img" />
        </div>
        <div class="assignee-details">
          <div class="assignee-name">{{ task.assignee.name }}</div>
          <div class="assignee-role">{{ task.assignee.role }}</div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: 'TaskCard',
  props: {
    task: {
      type: Object,
      default: () => ({
        id: '001',
        title: '电梯维修申请',
        type: '设施维修',
        description: '3号楼电梯按钮失灵，需要及时维修处理，影响业主正常出行安全。',
        status: '待处理',
        priority: '紧急',
        location: '3号楼 电梯间',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
        assignee: {
          name: '物业管理处',
          role: '维修部门',
          avatar: 'assets/1.svg'
        }
      })
    }
  },
  computed: {
    typeClass() {
      const typeMap = {
        '设施维修': 'type-maintenance',
        '投诉建议': 'type-complaint',
        '安全问题': 'type-security',
        '环境卫生': 'type-environment',
        '邻里纠纷': 'type-neighbor',
        '其他事项': 'type-other'
      }
      return typeMap[this.task.type] || 'type-other'
    },
    typeIcon() {
      const iconMap = {
        '设施维修': 'assets/1.svg',
        '投诉建议': 'assets/2.svg',
        '安全问题': 'assets/1.svg',
        '环境卫生': 'assets/2.svg',
        '邻里纠纷': 'assets/1.svg',
        '其他事项': 'assets/2.svg'
      }
      return iconMap[this.task.type] || 'assets/1.svg'
    },
    statusClass() {
      const statusMap = {
        '待处理': 'status-pending',
        '处理中': 'status-processing',
        '已完成': 'status-completed',
        '已关闭': 'status-closed'
      }
      return statusMap[this.task.status] || 'status-pending'
    },
    priorityClass() {
      const priorityMap = {
        '紧急': 'priority-urgent',
        '重要': 'priority-important',
        '普通': 'priority-normal',
        '低': 'priority-low'
      }
      return priorityMap[this.task.priority] || 'priority-normal'
    }
  },
  methods: {
    formatTime(date) {
      const now = new Date()
      const diff = now - new Date(date)
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)
      
      if (days > 0) return `${days}天前`
      if (hours > 0) return `${hours}小时前`
      if (minutes > 0) return `${minutes}分钟前`
      return '刚刚'
    }
  }
}
</script>

<style scoped>
.task-card {
  width: 360px;
  min-height: 320px;
  position: relative;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  font-family: 'Roboto', sans-serif;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

/* Header Section */
.header-section {
  width: 100%;
  height: 87px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 25px;
  box-sizing: border-box;
  border-bottom: 1px solid #f0f0f0;
}

.task-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-type-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.type-maintenance {
  background: #e3f2fd;
  color: #1976d2;
}

.type-complaint {
  background: #fff3e0;
  color: #f57c00;
}

.type-security {
  background: #ffebee;
  color: #d32f2f;
}

.type-environment {
  background: #e8f5e8;
  color: #388e3c;
}

.type-neighbor {
  background: #f3e5f5;
  color: #7b1fa2;
}

.type-other {
  background: #f5f5f5;
  color: #616161;
}

.type-icon {
  width: 16px;
  height: 16px;
}

.task-priority {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.priority-urgent {
  background: #ffebee;
  color: #d32f2f;
}

.priority-important {
  background: #fff3e0;
  color: #f57c00;
}

.priority-normal {
  background: #e8f5e8;
  color: #388e3c;
}

.priority-low {
  background: #f5f5f5;
  color: #757575;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.time-icon {
  width: 16px;
  height: 16px;
}

.time-text {
  color: #666;
  font-size: 12px;
  font-weight: 400;
}

/* Content Section */
.content-section {
  padding: 25px;
  flex: 1;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
  line-height: 1.3;
}

.task-description {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.task-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background: #fff3e0;
  color: #f57c00;
}

.status-processing {
  background: #e3f2fd;
  color: #1976d2;
}

.status-completed {
  background: #e8f5e8;
  color: #388e3c;
}

.status-closed {
  background: #f5f5f5;
  color: #757575;
}

.location-text {
  font-size: 12px;
  color: #999;
}

.assignee-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.assignee-avatar {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  overflow: hidden;
  background: #f0f0f0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.assignee-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.assignee-role {
  font-size: 12px;
  color: #666;
}

/* Responsive Design */
@media (max-width: 768px) {
  .task-card {
    width: 100%;
    max-width: 360px;
    margin: 0 auto;
  }
}

@media (max-width: 480px) {
  .task-card {
    border-radius: 12px;
    height: auto;
    min-height: 400px;
  }
  
  .task-title {
    font-size: 18px;
  }
  
  .task-description {
    font-size: 13px;
  }
  
  .header-section {
    height: 70px;
    padding: 0 20px;
  }
  
  .content-section {
    padding: 20px;
    height: auto;
  }
  
  .footer-section {
    height: 60px;
    padding: 0 20px;
  }
}
</style>