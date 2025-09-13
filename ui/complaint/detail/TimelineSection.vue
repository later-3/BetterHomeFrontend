<template>
  <div class="ongoing-section">
    <h3 class="section-title">{{ title }}</h3>
    
    <!-- Timeline -->
    <div class="timeline">
      <!-- Time labels -->
      <div class="time-labels">
        <div 
          v-for="time in timeLabels" 
          :key="time"
          class="time-label"
        >
          {{ time }}
        </div>
      </div>

      <!-- Events -->
      <div class="events">
        <!-- Event Cards -->
        <div 
          v-for="(event, index) in events" 
          :key="event.id"
          class="event"
          :class="event.type"
          @click="openEvent(event)"
        >
          <h4 class="event-title">{{ event.title }}</h4>
          <p class="event-subtitle">{{ event.subtitle }}</p>
          <div class="event-avatars">
            <div 
              v-for="avatar in event.avatars"
              :key="avatar.id"
              class="avatar-circle"
              :style="{ background: avatar.color }"
            ></div>
          </div>
          <span class="event-time">{{ event.time }}</span>
        </div>

        <!-- Timeline connector -->
        <div class="timeline-connector">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" fill="url(#gradient)" stroke="white" stroke-width="2"/>
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#8B78FF"/>
                <stop offset="100%" style="stop-color:#5451D6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TimelineSection',
  props: {
    title: {
      type: String,
      default: 'Ongoing'
    },
    timeLabels: {
      type: Array,
      default: () => ['9AM', '10AM', '10AM', '11AM', '12:00PM', '1PM']
    },
    events: {
      type: Array,
      default: () => [
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
    openEvent(event) {
      this.$emit('event-click', event);
      console.log(`Opening event: ${event.title}`);
    }
  }
}
</script>

<style scoped>
/* Ongoing Section */
.ongoing-section {
  padding: 30px 16px 0;
  width: 100%;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: black;
  margin: 0 0 70px 0;
  font-family: 'Product Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Timeline */
.timeline {
  display: flex;
  gap: 20px;
}

.time-labels {
  display: flex;
  flex-direction: column;
  gap: 59px;
  width: 50px;
}

.time-label {
  font-size: 14px;
  font-weight: 400;
  color: #8D8D8D;
  font-family: 'Product Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}

.events {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
}

/* Event Cards */
.event {
  width: 252px;
  height: 93px;
  border-radius: 15px;
  padding: 14px 15px;
  position: relative;
  color: white;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  font-family: 'Product Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}

.event:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.event-orange {
  background: linear-gradient(136deg, #FFD29D 0%, #FF9E2D 100%);
}

.event-blue {
  background: linear-gradient(136deg, #B1EEFF 0%, #29BAE2 100%);
}

.event-pink {
  background: linear-gradient(136deg, #FFA0BC 0%, #FF1B5E 100%);
}

.event-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 5px 0;
  color: white;
}

.event-subtitle {
  font-size: 10px;
  font-weight: 400;
  margin: 0 0 14px 0;
  color: white;
}

.event-avatars {
  position: absolute;
  bottom: 14px;
  left: 15px;
  display: flex;
  gap: 2px;
}

.avatar-circle {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.event-time {
  position: absolute;
  bottom: 14px;
  right: 15px;
  font-size: 10px;
  font-weight: 400;
  color: white;
}

/* Timeline Connector */
.timeline-connector {
  position: absolute;
  left: -33px;
  top: 126px;
  z-index: 10;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ongoing-section {
    padding: 20px 12px 0;
  }
  
  .event {
    width: 100%;
    max-width: 252px;
  }
  
  .timeline {
    gap: 15px;
  }
}

@media (max-width: 480px) {
  .section-title {
    font-size: 20px;
    margin-bottom: 40px;
  }
  
  .time-labels {
    gap: 45px;
  }
  
  .event {
    height: 80px;
    padding: 12px;
  }
  
  .event-title {
    font-size: 14px;
  }
  
  .event-subtitle {
    font-size: 9px;
  }
  
  .event-time {
    font-size: 9px;
  }
}
</style>