<template>
  <div class="task-list-container">
    <div class="task-list">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="task-card"
        @click="handleTaskClick(task)"
      >
        <!-- User Info Section -->
        <div class="user-info-section">
          <div class="user-avatar">
            {{ getAvatarText(task.assignee.name) }}
          </div>
          <div class="user-details">
            <div class="user-name-time">
              <span class="user-name">{{ task.assignee.name }}</span>
              <span class="task-time">• {{ formatTime(task.createdAt) }}</span>
            </div>

          </div>
        </div>

        <!-- Content Section -->
        <div class="content-section">
          <h3 class="task-title">{{ task.title }}</h3>
          <p class="task-description">{{ task.description }}</p>
        </div>
        
        <!-- Tags Section -->
        <div class="tags-section">
          <span :class="['category-tag', task.category]">{{ task.category }}</span>
          <span :class="['priority-badge', task.priority]">{{ task.priority }}</span>
          <span :class="['status-badge', task.status]">{{ task.status }}</span>
          <div class="location-tag">
            <span>📍</span>
            <span>{{ task.location }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TaskList',
  data() {
    return {
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
  methods: {
    handleTaskClick(task) {
      console.log('点击任务:', task.title)
      this.$emit('task-click', task)
    },
    getAvatarText(name) {
      return name ? name.charAt(0) : '?'
    },
    formatTime(createdAt) {
      const now = new Date();
      const taskTime = new Date(createdAt);
      const diffInHours = Math.floor((now - taskTime) / (1000 * 60 * 60));
      
      if (diffInHours < 1) {
        return '刚刚';
      } else if (diffInHours < 24) {
        return `${diffInHours}小时前`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}天前`;
      }
    }
  },
  emits: ['task-click']
}
</script>

<style scoped>
.task-list-container {
  width: 100%;
  padding: 16px;
  background: transparent;
  box-sizing: border-box;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* TaskCard 样式 */
.task-card {
  width: 100%;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  cursor: pointer;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* User Info Section */
.user-info-section {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 16px 20px 8px 20px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.user-name-time {
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  color: #00030F;
}

.task-time {
  font-size: 12px;
  color: #808187;
}



/* Tags Section */
.tags-section {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 0 20px 16px 20px;
}

.location-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #808187;
}



.category-tag {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  color: white;
  background: #6c757d;
}

.category-tag.设施维修 { background: #dc3545; }
.category-tag.投诉建议 { background: #fd7e14; }
.category-tag.安全问题 { background: #e83e8c; }
.category-tag.环境卫生 { background: #20c997; }
.category-tag.邻里纠纷 { background: #6f42c1; }
.category-tag.其他事项 { background: #6c757d; }

.priority-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  color: white;
}

.priority-badge.紧急 { background: #dc3545; }
.priority-badge.重要 { background: #fd7e14; }
.priority-badge.普通 { background: #28a745; }
.priority-badge.低 { background: #6c757d; }

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  color: white;
}

.status-badge.待处理 { background: #ffc107; color: #000; }
.status-badge.处理中 { background: #17a2b8; }
.status-badge.已完成 { background: #28a745; }
.status-badge.已关闭 { background: #6c757d; }

/* Content Section */
.content-section {
  padding: 4px 20px 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-title {
  font-size: 20px;
  font-weight: 600;
  color: #212529;
  line-height: 1.3;
  margin: 0;
}

.task-description {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 1.5em; /* 确保至少显示1行 */
  max-height: 4.5em; /* 最多显示3行 (1.5em × 3) */
}


</style>