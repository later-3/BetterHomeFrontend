<template>
  <div class="announce-page">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">Events</h1>
    </div>

    <!-- Events List -->
    <div class="events-container">
      <div 
        v-for="event in events" 
        :key="event.id"
        class="event-card"
        @click="handleEventClick(event)"
      >
        <!-- Event Icon -->
        <div class="event-icon" :style="{ background: event.iconBg }">
          <img :src="event.icon" :alt="event.title" />
        </div>

        <!-- Event Content -->
        <div class="event-content">
          <!-- Date and Time -->
          <div class="event-datetime">
            <span class="event-day">{{ event.day }}</span>
            <span class="event-time">{{ event.time }}</span>
          </div>

          <!-- Event Title -->
          <h3 class="event-title">{{ event.title }}</h3>

          <!-- Event Location -->
          <div class="event-location">
            <img src="../../assets/CodeBubbyAssets/39_1118/location-icon.svg" alt="Location" class="location-icon" />
            <span class="location-text">{{ event.location }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AnnouncePage',
  data() {
    return {
      events: [
        {
          id: 1,
          day: 'Wed, Apr 28',
          time: '5:30 PM',
          title: "Jo Malone London's Mother's Day Presents",
          location: 'Radius Gallery • Santa Cruz, CA',
          icon: '../../assets/CodeBubbyAssets/39_1118/1.svg',
          iconBg: 'linear-gradient(135deg, #FFE5E5 0%, #FFB3B3 100%)'
        },
        {
          id: 2,
          day: 'Sat, May 1',
          time: '2:00 PM',
          title: 'A Virtual Evening of Smooth Jazz',
          location: 'Lot 13 • Oakland, CA',
          icon: '../../assets/CodeBubbyAssets/39_1118/2.svg',
          iconBg: 'linear-gradient(135deg, #4A1A5C 0%, #7B2D8E 100%)'
        },
        {
          id: 3,
          day: 'Sat, Apr 24',
          time: '1:30 PM',
          title: "Women's Leadership Conference 2021",
          location: '53 Bush St • San Francisco, CA',
          icon: '../../assets/CodeBubbyAssets/39_1118/3.svg',
          iconBg: 'linear-gradient(135deg, #E8D5FF 0%, #C4A3FF 100%)'
        },
        {
          id: 4,
          day: 'Fri, Apr 23',
          time: '6:00 PM',
          title: 'International Kids Safe Parents Night Out',
          location: 'Lot 13 • Oakland, CA',
          icon: '../../assets/CodeBubbyAssets/39_1118/4.svg',
          iconBg: 'linear-gradient(135deg, #B3E5FC 0%, #81D4FA 100%)'
        },
        {
          id: 5,
          day: 'Mon, Jun 21',
          time: '10:00 PM',
          title: 'Collectivity Plays the Music of Jimi',
          location: 'Longboard Margarita Bar',
          icon: '../../assets/CodeBubbyAssets/39_1118/5.svg',
          iconBg: 'linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%)'
        },
        {
          id: 6,
          day: 'Sun, Apr 25',
          time: '10:15 AM',
          title: 'International Gala Music Festival',
          location: '36 Guild Street London, UK',
          icon: '../../assets/CodeBubbyAssets/39_1118/6.svg',
          iconBg: 'linear-gradient(135deg, #E0F2F1 0%, #80CBC4 100%)'
        }
      ]
    }
  },
  methods: {
    handleEventClick(event) {
      this.$emit('event-click', event);
      console.log('Event clicked:', event);
    }
  }
}
</script>

<style scoped>
.announce-page {
  width: 100%;
  max-width: 375px;
  margin: 0 auto;
  background: #FAFAFA;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.page-header {
  padding: 60px 24px 24px;
  background: white;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #1A1A1A;
  margin: 0;
}

.events-container {
  padding: 0 24px 24px;
}

.event-card {
  display: flex;
  align-items: flex-start;
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.3s ease;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.event-card:last-child {
  margin-bottom: 0;
}

.event-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
}

.event-icon img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.event-content {
  flex: 1;
  min-width: 0;
}

.event-datetime {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.event-day {
  font-size: 13px;
  font-weight: 500;
  color: #5669FF;
}

.event-time {
  font-size: 13px;
  font-weight: 400;
  color: #5669FF;
}

.event-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A1A;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.event-location {
  display: flex;
  align-items: center;
  gap: 6px;
}

.location-icon {
  width: 14px;
  height: 14px;
  opacity: 0.6;
}

.location-text {
  font-size: 13px;
  color: #747688;
  line-height: 1.3;
}

/* Responsive Design */
@media (min-width: 768px) {
  .announce-page {
    max-width: 768px;
  }
  
  .events-container {
    padding: 0 32px 32px;
  }
  
  .page-header {
    padding: 80px 32px 32px;
  }
  
  .event-card {
    padding: 20px;
    margin-bottom: 20px;
  }
  
  .event-icon {
    width: 70px;
    height: 70px;
    margin-right: 20px;
  }
  
  .event-icon img {
    width: 36px;
    height: 36px;
  }
  
  .event-title {
    font-size: 18px;
  }
}

@media (min-width: 1024px) {
  .announce-page {
    max-width: 1024px;
  }
  
  .events-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 24px;
    padding: 0 40px 40px;
  }
  
  .event-card {
    margin-bottom: 0;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .announce-page {
    background: #1A1A1A;
  }
  
  .page-header {
    background: #2A2A2A;
  }
  
  .page-title {
    color: #FFFFFF;
  }
  
  .event-card {
    background: #2A2A2A;
    box-shadow: 0 2px 8px rgba(255, 255, 255, 0.04);
  }
  
  .event-card:hover {
    box-shadow: 0 4px 16px rgba(255, 255, 255, 0.08);
  }
  
  .event-title {
    color: #FFFFFF;
  }
  
  .location-text {
    color: #A0A0A0;
  }
}
</style>