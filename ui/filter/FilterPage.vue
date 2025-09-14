<template>
  <div class="filter-page">
    <!-- Header -->
    <div class="filter-header">
      <div class="header-indicator"></div>
      <h1 class="filter-title">Filter</h1>
    </div>

    <!-- Category Selection -->
    <div class="category-section">
      <div class="category-grid">
        <div 
          v-for="category in categories" 
          :key="category.id"
          class="category-item"
          :class="{ active: selectedCategories.includes(category.id) }"
          @click="toggleCategory(category.id)"
        >
          <div class="category-icon">
            <img :src="category.icon" :alt="category.name" />
          </div>
          <span class="category-name">{{ category.name }}</span>
        </div>
      </div>
    </div>

    <!-- Time & Date Section -->
    <div class="time-date-section">
      <h3 class="section-title">Time & Date</h3>
      <div class="time-options">
        <button 
          v-for="option in timeOptions" 
          :key="option.id"
          class="time-option"
          :class="{ active: selectedTime === option.id }"
          @click="selectTime(option.id)"
        >
          {{ option.label }}
        </button>
      </div>
      <button class="calendar-option" @click="openCalendar">
        <img src="../../assets/CodeBubbyAssets/39_1380/17.svg" alt="Calendar" class="calendar-icon" />
        <span>Choose from calendar</span>
        <img src="../../assets/CodeBubbyAssets/39_1380/18.svg" alt="Arrow" class="arrow-icon" />
      </button>
    </div>

    <!-- Location Section -->
    <div class="location-section">
      <h3 class="section-title">Location</h3>
      <div class="location-input" @click="openLocationPicker">
        <div class="location-icon">
          <img src="../../assets/CodeBubbyAssets/39_1380/14.svg" alt="Location background" />
          <img src="../../assets/CodeBubbyAssets/39_1380/15.svg" alt="Location circle" class="location-circle" />
          <img src="../../assets/CodeBubbyAssets/39_1380/16.svg" alt="Location pin" class="location-pin" />
        </div>
        <span class="location-text">{{ selectedLocation }}</span>
        <img src="../../assets/CodeBubbyAssets/39_1380/13.svg" alt="Arrow" class="location-arrow" />
      </div>
    </div>

    <!-- Price Range Section -->
    <div class="price-section">
      <div class="price-header">
        <h3 class="section-title">Select price range</h3>
        <span class="price-display">${{ priceRange.min }}-${{ priceRange.max }}</span>
      </div>
      <div class="price-slider-container">
        <div class="price-slider">
          <div class="slider-track"></div>
          <div class="slider-range" :style="sliderRangeStyle"></div>
          <div 
            class="slider-thumb slider-thumb-min" 
            :style="{ left: minThumbPosition }"
            @mousedown="startDrag('min', $event)"
            @touchstart="startDrag('min', $event)"
          >
            <div class="thumb-handle">
              <img src="../../assets/CodeBubbyAssets/39_1380/11.svg" alt="Min handle" />
            </div>
          </div>
          <div 
            class="slider-thumb slider-thumb-max" 
            :style="{ left: maxThumbPosition }"
            @mousedown="startDrag('max', $event)"
            @touchstart="startDrag('max', $event)"
          >
            <div class="thumb-handle">
              <img src="../../assets/CodeBubbyAssets/39_1380/10.svg" alt="Max handle" />
            </div>
          </div>
        </div>
        <!-- City skyline background -->
        <div class="city-skyline">
          <img src="../../assets/CodeBubbyAssets/39_1380/2.svg" alt="Building 1" class="building" style="left: 0px; top: 32px;" />
          <img src="../../assets/CodeBubbyAssets/39_1380/3.svg" alt="Building 2" class="building" style="left: 14px; top: 0px;" />
          <img src="../../assets/CodeBubbyAssets/39_1380/4.svg" alt="Building 3" class="building" style="left: 28px; top: 13px;" />
          <img src="../../assets/CodeBubbyAssets/39_1380/5.svg" alt="Building 4" class="building" style="left: 85px; top: 13px;" />
          <img src="../../assets/CodeBubbyAssets/39_1380/6.svg" alt="Building 5" class="building" style="left: 43px; top: 22px;" />
          <img src="../../assets/CodeBubbyAssets/39_1380/7.svg" alt="Building 6" class="building" style="left: 71px; top: 22px;" />
          <img src="../../assets/CodeBubbyAssets/39_1380/8.svg" alt="Building 7" class="building" style="left: 57px; top: 26px;" />
          <img src="../../assets/CodeBubbyAssets/39_1380/9.svg" alt="Building 8" class="building" style="left: 100px; top: 13px;" />
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <button class="reset-btn" @click="resetFilters">RESET</button>
      <button class="apply-btn" @click="applyFilters">
        <img src="../../assets/CodeBubbyAssets/39_1380/12.svg" alt="Apply background" />
        <span>APPLY</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FilterPage',
  data() {
    return {
      selectedCategories: [0, 2], // Sports and Art selected by default
      selectedTime: 'tomorrow',
      selectedLocation: 'New York, USA',
      priceRange: {
        min: 20,
        max: 120
      },
      minPrice: 0,
      maxPrice: 200,
      isDragging: false,
      dragType: null,
      categories: [
        { id: 0, name: 'Sports', icon: '../../assets/CodeBubbyAssets/39_1380/23.svg' },
        { id: 1, name: 'Music', icon: '../../assets/CodeBubbyAssets/39_1380/19.svg' },
        { id: 2, name: 'Art', icon: '../../assets/CodeBubbyAssets/39_1380/21.svg' },
        { id: 3, name: 'Food', icon: '../../assets/CodeBubbyAssets/39_1380/25.svg' },
        { id: 4, name: 'Food', icon: '../../assets/CodeBubbyAssets/39_1380/27.svg' }
      ],
      timeOptions: [
        { id: 'today', label: 'Today' },
        { id: 'tomorrow', label: 'Tomorrow' },
        { id: 'thisweek', label: 'This week' }
      ]
    }
  },
  computed: {
    minThumbPosition() {
      const percentage = ((this.priceRange.min - this.minPrice) / (this.maxPrice - this.minPrice)) * 100;
      return `${percentage}%`;
    },
    maxThumbPosition() {
      const percentage = ((this.priceRange.max - this.minPrice) / (this.maxPrice - this.minPrice)) * 100;
      return `${percentage}%`;
    },
    sliderRangeStyle() {
      const minPercentage = ((this.priceRange.min - this.minPrice) / (this.maxPrice - this.minPrice)) * 100;
      const maxPercentage = ((this.priceRange.max - this.minPrice) / (this.maxPrice - this.minPrice)) * 100;
      return {
        left: `${minPercentage}%`,
        width: `${maxPercentage - minPercentage}%`
      };
    }
  },
  methods: {
    toggleCategory(categoryId) {
      const index = this.selectedCategories.indexOf(categoryId);
      if (index > -1) {
        this.selectedCategories.splice(index, 1);
      } else {
        this.selectedCategories.push(categoryId);
      }
    },
    selectTime(timeId) {
      this.selectedTime = timeId;
    },
    openCalendar() {
      // Calendar picker logic
      console.log('Open calendar picker');
    },
    openLocationPicker() {
      // Location picker logic
      console.log('Open location picker');
    },
    startDrag(type, event) {
      this.isDragging = true;
      this.dragType = type;
      
      const moveHandler = (e) => this.handleDrag(e);
      const upHandler = () => this.stopDrag(moveHandler, upHandler);
      
      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseup', upHandler);
      document.addEventListener('touchmove', moveHandler);
      document.addEventListener('touchend', upHandler);
      
      event.preventDefault();
    },
    handleDrag(event) {
      if (!this.isDragging) return;
      
      const slider = this.$el.querySelector('.slider-track');
      const rect = slider.getBoundingClientRect();
      const clientX = event.clientX || (event.touches && event.touches[0].clientX);
      const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const value = Math.round(this.minPrice + (percentage / 100) * (this.maxPrice - this.minPrice));
      
      if (this.dragType === 'min') {
        this.priceRange.min = Math.min(value, this.priceRange.max - 10);
      } else {
        this.priceRange.max = Math.max(value, this.priceRange.min + 10);
      }
    },
    stopDrag(moveHandler, upHandler) {
      this.isDragging = false;
      this.dragType = null;
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
      document.removeEventListener('touchmove', moveHandler);
      document.removeEventListener('touchend', upHandler);
    },
    resetFilters() {
      this.selectedCategories = [];
      this.selectedTime = 'today';
      this.selectedLocation = 'New York, USA';
      this.priceRange = { min: 20, max: 120 };
      this.$emit('reset');
    },
    applyFilters() {
      const filters = {
        categories: this.selectedCategories,
        time: this.selectedTime,
        location: this.selectedLocation,
        priceRange: this.priceRange
      };
      this.$emit('apply', filters);
      console.log('Applied filters:', filters);
    }
  }
}
</script>

<style scoped>
.filter-page {
  width: 375px;
  height: 812px;
  background: #F6F7FB;
  position: relative;
  font-family: 'Airbnb Cereal App', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow: hidden;
}

.filter-header {
  position: absolute;
  top: 71px;
  left: 0;
  right: 0;
  height: 741px;
  background: white;
  border-top-left-radius: 38px;
  border-top-right-radius: 38px;
  padding: 20px;
}

.header-indicator {
  width: 27px;
  height: 5px;
  background: #D1D5DB;
  border-radius: 2.5px;
  margin: 12px auto 20px;
}

.filter-title {
  font-size: 25px;
  font-weight: 400;
  color: black;
  margin: 0 0 30px 0;
}

.category-section {
  margin-bottom: 40px;
}

.category-grid {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
}

.category-icon {
  width: 63px;
  height: 63px;
  border-radius: 50%;
  background: #E5E7EB;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  position: relative;
  transition: all 0.3s ease;
}

.category-item.active .category-icon {
  background: #5669FF;
}

.category-icon img {
  width: 30px;
  height: 30px;
}

.category-name {
  font-size: 14px;
  color: #120D26;
  text-align: center;
}

.section-title {
  font-size: 16px;
  font-weight: 400;
  color: #120D26;
  margin: 0 0 20px 0;
}

.time-date-section {
  margin-bottom: 40px;
}

.time-options {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}

.time-option {
  padding: 9px 19px;
  border-radius: 10px;
  border: 1px solid #E6E6E6;
  background: white;
  font-size: 15px;
  color: #807A7A;
  cursor: pointer;
  transition: all 0.3s ease;
}

.time-option.active {
  background: #5669FF;
  color: white;
  border-color: #5669FF;
}

.calendar-option {
  width: 241px;
  height: 42px;
  background: white;
  border: 1px solid #E6E6E6;
  border-radius: 10px;
  display: flex;
  align-items: center;
  padding: 0 14px;
  cursor: pointer;
  font-size: 15px;
  color: #807A7A;
}

.calendar-icon {
  width: 24px;
  height: 24px;
  margin-right: 10px;
}

.arrow-icon {
  width: 8px;
  height: 8px;
  margin-left: auto;
}

.location-section {
  margin-bottom: 40px;
}

.location-input {
  width: 334px;
  height: 60px;
  background: white;
  border: 1px solid #E5E5E5;
  border-radius: 15px;
  display: flex;
  align-items: center;
  padding: 8px;
  cursor: pointer;
}

.location-icon {
  width: 45px;
  height: 45px;
  position: relative;
  margin-right: 18px;
}

.location-circle {
  position: absolute;
  top: 7px;
  left: 7px;
  width: 31px;
  height: 31px;
}

.location-pin {
  position: absolute;
  top: 15px;
  left: 15px;
  width: 15px;
  height: 15px;
}

.location-text {
  font-size: 16px;
  color: #141736;
  flex: 1;
}

.location-arrow {
  width: 8px;
  height: 8px;
}

.price-section {
  margin-bottom: 40px;
}

.price-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.price-display {
  font-size: 18px;
  color: #3F38DD;
  font-weight: 400;
}

.price-slider-container {
  position: relative;
  height: 66px;
}

.price-slider {
  position: relative;
  height: 4px;
  margin: 31px 0;
}

.slider-track {
  width: 100%;
  height: 4px;
  background: #E5E7EB;
  border-radius: 2px;
}

.slider-range {
  position: absolute;
  height: 4px;
  background: #5669FF;
  border-radius: 2px;
  top: 0;
}

.slider-thumb {
  position: absolute;
  top: -8px;
  width: 20px;
  height: 20px;
  cursor: pointer;
  transform: translateX(-50%);
}

.thumb-handle {
  width: 20px;
  height: 20px;
  background: white;
  border: 2px solid #5669FF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-handle img {
  width: 8px;
  height: 8px;
}

.city-skyline {
  position: absolute;
  top: 0;
  left: 84px;
  width: 157px;
  height: 51px;
  pointer-events: none;
}

.building {
  position: absolute;
}

.action-buttons {
  display: flex;
  gap: 19px;
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
}

.reset-btn {
  width: 130px;
  height: 58px;
  background: white;
  border: 1px solid #E5E5E5;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 500;
  color: #120D26;
  letter-spacing: 1px;
  cursor: pointer;
}

.apply-btn {
  flex: 1;
  height: 58px;
  background: #5669FF;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 500;
  color: white;
  letter-spacing: 1px;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.apply-btn img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.apply-btn span {
  position: relative;
  z-index: 1;
}

/* Responsive adjustments */
@media (max-width: 375px) {
  .filter-page {
    width: 100vw;
  }
  
  .location-input {
    width: calc(100vw - 40px);
  }
}
</style>