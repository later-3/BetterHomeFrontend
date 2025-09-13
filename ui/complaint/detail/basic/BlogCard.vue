<template>
  <div class="blog-card">
    <!-- Header Section with Author Info -->
    <div class="header-section">
      <div class="author-info">
        <div class="author-container">
          <div class="avatar">
            <img :src="authorAvatar" alt="Author Avatar" />
          </div>
          <div class="author-details">
            <div class="author-name">{{ authorName }}</div>
            <div class="author-role">{{ authorRole }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Section -->
    <div class="content-section">
      <h2 class="title">{{ title }}</h2>
      <div class="date">{{ publishDate }}</div>
      <div class="excerpt">{{ excerpt }}</div>
    </div>

    <!-- Tags Section -->
    <div class="tags-section">
      <span 
        v-for="tag in tags" 
        :key="tag" 
        class="tag"
      >
        {{ tag }}
      </span>
    </div>

    <!-- Stats Section -->
    <div class="stats-section">
      <div class="stat-item">
        <img src="assets/1.svg" alt="Likes" class="stat-icon" />
        <span class="stat-value">{{ likes }}</span>
      </div>
      <div class="stat-item">
        <img src="assets/2.svg" alt="Comments" class="stat-icon" />
        <span class="stat-value">{{ comments }}</span>
      </div>
      <div class="stat-item">
        <img src="assets/3.svg" alt="Views" class="stat-icon" />
        <span class="stat-value">{{ views }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BlogCard',
  props: {
    authorName: {
      type: String,
      default: 'Robert Fox'
    },
    authorRole: {
      type: String,
      default: 'Web Development'
    },
    authorAvatar: {
      type: String,
      default: 'assets/1.svg'
    },
    title: {
      type: String,
      default: 'Minim dolor in amet nulla laboris'
    },
    publishDate: {
      type: String,
      default: 'September 23, 2021'
    },
    excerpt: {
      type: String,
      default: 'Minim dolor in amet nulla laboris enim dolore consequat proident fugiat culpa eiusmod...'
    },
    tags: {
      type: Array,
      default: () => ['React', 'Javascript', 'Angular']
    },
    likes: {
      type: String,
      default: '20k'
    },
    comments: {
      type: String,
      default: '34'
    },
    views: {
      type: String,
      default: '567'
    }
  }
}
</script>

<style scoped>
.blog-card {
  width: 360px;
  height: 533px;
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
  height: 110px;
  position: absolute;
  left: 0;
  top: 0;
  overflow: hidden;
}

.author-info {
  width: 310px;
  height: 60px;
  position: absolute;
  left: 25px;
  top: 25px;
  overflow: hidden;
}

.author-container {
  width: 310px;
  height: 60px;
  position: relative;
  overflow: hidden;
}

.avatar {
  position: absolute;
  left: 0;
  top: 0;
  width: 60px;
  height: 60px;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.author-details {
  width: 240px;
  height: 52px;
  position: absolute;
  left: 70px;
  top: 4px;
  overflow: hidden;
}

.author-name {
  position: absolute;
  left: 0;
  top: 0;
  color: black;
  font-size: 20px;
  font-weight: 500;
  word-wrap: break-word;
}

.author-role {
  width: 240px;
  position: absolute;
  left: 0;
  top: 26px;
  color: #78858F;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.50px;
  word-wrap: break-word;
}

/* Content Section */
.content-section {
  width: 360px;
  height: 243px;
  position: absolute;
  left: 0;
  top: 114.33px;
  overflow: hidden;
}

.title {
  width: 310px;
  position: absolute;
  left: 25px;
  top: 25px;
  color: black;
  font-size: 29px;
  font-weight: 700;
  word-wrap: break-word;
  margin: 0;
  line-height: 1.2;
}

.date {
  width: 310px;
  position: absolute;
  left: 25px;
  top: 111px;
  color: #838383;
  font-size: 17px;
  font-weight: 400;
  word-wrap: break-word;
}

.excerpt {
  width: 310px;
  height: 73px;
  position: absolute;
  left: 25px;
  top: 145px;
  color: black;
  font-size: 17px;
  font-weight: 400;
  word-wrap: break-word;
  line-height: 1.4;
}

/* Tags Section */
.tags-section {
  width: 360px;
  height: 77px;
  position: absolute;
  left: 0;
  top: 361.67px;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding-left: 25px;
  gap: 10px;
}

.tag {
  height: 27px;
  background: #EB3349;
  border-radius: 4px;
  padding: 5px 15px;
  color: white;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  word-wrap: break-word;
}

/* Stats Section */
.stats-section {
  width: 360px;
  height: 90px;
  position: absolute;
  left: 0;
  top: 443px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 25px;
}

.stat-item {
  display: flex;
  align-items: center;
  height: 40px;
  overflow: hidden;
}

.stat-icon {
  width: 40px;
  height: 40px;
  margin-right: 5px;
}

.stat-value {
  color: black;
  font-size: 16px;
  font-weight: 500;
  word-wrap: break-word;
}

/* Responsive Design */
@media (max-width: 768px) {
  .blog-card {
    width: 100%;
    max-width: 360px;
    margin: 0 auto;
  }
}

@media (max-width: 480px) {
  .blog-card {
    border-radius: 12px;
  }
  
  .title {
    font-size: 24px;
  }
  
  .author-name {
    font-size: 18px;
  }
}
</style>