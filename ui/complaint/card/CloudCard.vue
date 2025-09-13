<template>
  <div class="cloud-card">
    <!-- Header Section -->
    <div class="header-section">
      <div class="title-container">
        <div class="cloud-icon">
          <img src="assets/1.svg" alt="Cloud Icon" />
        </div>
        <div class="title">{{ title }}</div>
      </div>
      <div class="time-container">
        <div class="time-icon">
          <img src="assets/2.svg" alt="Time Icon" />
        </div>
        <div class="time-text">{{ timeText }}</div>
      </div>
    </div>

    <!-- Content Section -->
    <div class="content-section">
      <div class="section-title">{{ sectionTitle }}</div>
      <div class="image-container">
        <img :src="workImage" :alt="workImageAlt" class="work-image" />
      </div>
      <div class="date-text">{{ dateText }}</div>
      <div class="description">{{ description }}</div>
    </div>

    <!-- Footer Section -->
    <div class="footer-section">
      <div class="view-all-text">{{ viewAllText }}</div>
      <div class="arrow-icon">
        <img src="assets/4.svg" alt="Arrow Icon" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CloudCard',
  props: {
    title: {
      type: String,
      default: 'Cloud'
    },
    timeText: {
      type: String,
      default: '42 min'
    },
    sectionTitle: {
      type: String,
      default: 'Last work'
    },
    workImage: {
      type: String,
      default: 'assets/3.png'
    },
    workImageAlt: {
      type: String,
      default: 'Last work preview'
    },
    dateText: {
      type: String,
      default: 'November 14'
    },
    description: {
      type: String,
      default: 'This impressive paella is a perfect party dishaa....'
    },
    viewAllText: {
      type: String,
      default: 'VIEW ALL'
    }
  },
  emits: ['view-all-click'],
  methods: {
    handleViewAllClick() {
      this.$emit('view-all-click');
    }
  }
}
</script>

<style scoped>
.cloud-card {
  width: 360px;
  height: 476px;
  position: relative;
  background: white;
  overflow: hidden;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  font-family: 'Roboto', sans-serif;
}

/* Header Section */
.header-section {
  width: 360px;
  height: 87px;
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 25px;
  box-sizing: border-box;
}

.title-container {
  width: 120px;
  height: 37px;
  position: relative;
  display: flex;
  align-items: center;
}

.cloud-icon {
  position: absolute;
  left: 0;
  top: 0;
  width: 40px;
  height: 37px;
}

.cloud-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.title {
  position: absolute;
  left: 47px;
  top: 2px;
  color: black;
  font-size: 28px;
  font-weight: 500;
  word-wrap: break-word;
}

.time-container {
  width: 60px;
  height: 22px;
  position: relative;
  display: flex;
  align-items: center;
}

.time-icon {
  position: absolute;
  left: 0;
  top: 2.5px;
  width: 20px;
  height: 17px;
}

.time-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.time-text {
  position: absolute;
  left: 22px;
  top: 0;
  color: black;
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.25px;
  word-wrap: break-word;
}

/* Content Section */
.content-section {
  width: 360px;
  height: 313px;
  position: absolute;
  left: 0;
  top: 87px;
  padding: 25px;
  box-sizing: border-box;
}

.section-title {
  position: absolute;
  left: 25px;
  top: 25px;
  color: black;
  font-size: 20px;
  font-weight: 500;
  word-wrap: break-word;
}

.image-container {
  position: absolute;
  left: 25px;
  top: 58px;
  width: 310px;
  height: 140px;
}

.work-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 15px;
}

.date-text {
  position: absolute;
  left: 25px;
  top: 208px;
  color: #747474;
  font-size: 16px;
  font-weight: 400;
  letter-spacing: 0.50px;
  word-wrap: break-word;
}

.description {
  width: 285px;
  height: 47px;
  position: absolute;
  left: 25px;
  top: 241px;
  color: black;
  font-size: 16px;
  font-weight: 400;
  letter-spacing: 0.50px;
  word-wrap: break-word;
  line-height: 1.4;
}

/* Footer Section */
.footer-section {
  width: 360px;
  height: 76px;
  position: absolute;
  left: 0;
  top: 400px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 25px;
  box-sizing: border-box;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.footer-section:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.view-all-text {
  color: black;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.50px;
  word-wrap: break-word;
}

.arrow-icon {
  width: 24px;
  height: 24px;
}

.arrow-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Responsive Design */
@media (max-width: 768px) {
  .cloud-card {
    width: 100%;
    max-width: 360px;
    margin: 0 auto;
  }
}

@media (max-width: 480px) {
  .cloud-card {
    border-radius: 12px;
  }
  
  .title {
    font-size: 24px;
  }
  
  .section-title {
    font-size: 18px;
  }
  
  .description {
    font-size: 14px;
  }
}

/* Interactive States */
.footer-section:active {
  transform: translateY(1px);
}

.work-image:hover {
  transform: scale(1.02);
  transition: transform 0.3s ease;
}
</style>