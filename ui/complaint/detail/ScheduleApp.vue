<template>
  <div class="schedule-app">
    <!-- Header with back button and avatar -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <img src="../../../assets/CodeBubbyAssets/43_2507/15.svg" alt="Back" />
      </button>
      <div class="avatar">
        <img src="../../../assets/CodeBubbyAssets/43_2507/17.svg" alt="Avatar" />
      </div>
    </div>

    <!-- Month Navigation -->
    <div class="month-navigation">
      <button class="nav-btn prev" @click="previousMonth">
        <img src="../../../assets/CodeBubbyAssets/43_2507/13.svg" alt="Previous" />
        <span>Mar</span>
      </button>
      <h2 class="current-month">{{ currentMonth }}</h2>
      <button class="nav-btn next" @click="nextMonth">
        <span>May</span>
        <img src="../../../assets/CodeBubbyAssets/43_2507/14.svg" alt="Next" />
      </button>
    </div>

    <!-- Date Selector -->
    <div class="date-selector">
      <div 
        v-for="date in dates" 
        :key="date.day"
        class="date-item"
        :class="{ active: date.active }"
        @click="selectDate(date)"
      >
        <span class="day-number">{{ date.day }}</span>
        <span class="day-name">{{ date.name }}</span>
      </div>
    </div>

    <!-- Timeline Section Component -->
    <TimelineSection 
      :title="timelineTitle"
      :timeLabels="timeLabels"
      :events="events"
      @event-click="handleEventClick"
    />


  </div>
</template>

<script>
import TimelineSection from './TimelineSection.vue'

export default {
  name: 'ScheduleApp',
  components: {
    TimelineSection
  },
  data() {
    return {
      currentMonth: 'April',
      dates: [
        { day: 4, name: 'Sat', active: false },
        { day: 5, name: 'Sun', active: true },
        { day: 6, name: 'Mon', active: false },
        { day: 7, name: 'Tue', active: false }
      ],
      timelineTitle: 'Ongoing',
      timeLabels: ['9AM', '10AM', '10AM', '11AM', '12:00PM', '1PM'],
      events: [
        {
          id: 1,
          title: 'Information Architecture',
          subtitle: 'Saber & Oro',
          time: '9.00 AM - 10.00 AM',
          type: 'event-orange',
          avatars: [
            { id: 1, color: '#ff6b6b' },
            { id: 2, color: '#4ecdc4' }
          ]
        },
        {
          id: 2,
          title: 'Software Testing',
          subtitle: 'Saber & Mike',
          time: '11.00AM - 12.00 PM',
          type: 'event-blue',
          avatars: [
            { id: 3, color: '#45b7d1' },
            { id: 4, color: '#96ceb4' }
          ]
        },
        {
          id: 3,
          title: 'Mobile App Design',
          subtitle: 'Saber & Fahim',
          time: '1.00 AM - 2.00 AM',
          type: 'event-pink',
          avatars: [
            { id: 5, color: '#f093fb' },
            { id: 6, color: '#f5576c' }
          ]
        }
      ]
    }
  },
  methods: {
    goBack() {
      console.log('Going back...')
    },
    previousMonth() {
      console.log('Previous month')
    },
    nextMonth() {
      console.log('Next month')
    },
    selectDate(date) {
      this.dates.forEach(d => d.active = false)
      date.active = true
    },
    handleEventClick(event) {
      console.log('Event clicked:', event)
      alert(`打开事件: ${event.title}`)
    }
  }
}
</script>

<style scoped>
.schedule-app {
  width: 375px;
  height: 812px;
  background: linear-gradient(180deg, white 0%, #F8F6FF 100%);
  border-radius: 40px;
  overflow: hidden;
  position: relative;
  font-family: 'Product Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 59px 24px 0;
}

.back-btn {
  width: 56px;
  height: 56px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Month Navigation */
.month-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 18px;
  margin-top: 10px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 400;
  color: black;
}

.current-month {
  font-size: 24px;
  font-weight: 700;
  color: black;
  margin: 0;
}

/* Date Selector */
.date-selector {
  display: flex;
  gap: 21px;
  padding: 0 16px;
  margin-top: 59px;
}

.date-item {
  width: 70px;
  height: 120px;
  background: white;
  box-shadow: 0px 4px 25px rgba(141, 141, 141, 0.10);
  border-radius: 43px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.date-item.active {
  background: linear-gradient(136deg, #8B78FF 0%, #5451D6 100%);
  box-shadow: 0px -9px 20px rgba(0, 0, 0, 0.15) inset;
  color: white;
}

.date-item.active::before {
  content: '';
  position: absolute;
  width: 70px;
  height: 120px;
  background: linear-gradient(136deg, #8B78FF 0%, #5451D6 100%);
  opacity: 0.5;
  border-radius: 38.5px;
  filter: blur(16px);
  z-index: -1;
  left: 0;
  top: 0;
}

.day-number {
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
}

.day-name {
  font-size: 14px;
  font-weight: 400;
  margin-top: 4px;
}

.date-item.active .day-number,
.date-item.active .day-name {
  color: white;
}





/* Responsive adjustments */
@media (max-width: 768px) {
  .schedule-app {
    width: 100%;
    max-width: 375px;
    margin: 0 auto;
  }
}
</style>