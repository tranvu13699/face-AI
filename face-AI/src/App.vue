<template>
    <div class="wrap">
      <div>
        <img style="max-height: 50px;" src="./assets/face.png" alt="face.png">
        <h1 class="mb-4" style="color: #ea580c;">FACE AI</h1>
      </div>
      <div class="wrap-content w-100">
        <ul class="nav nav-tabs">
          <!-- <li class="nav-item">
              <a class="nav-link" :class="{'active' : activeContent === 'face-recognition'}" 
              @click="setActive('face-recognition')">Face Recognition</a>
          </li>
          <li class="nav-item">
              <a class="nav-link" :class="{'active' : activeContent === 'face-liveness'}" 
              @click="setActive('face-liveness')">Face Liveness, Analysis</a>
          </li> -->
          <li class="nav-item">
              <a class="nav-link" :class="{'active' : activeContent === 'face-matching'}" 
              @click="setActive('face-matching')">Face Matching</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{'active' : activeContent === 'detection-face'}" 
              @click="setActive('detection-face')">Detection Face</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{'active' : activeContent === 'register-face'}" 
              @click="setActive('register-face')">Register Face</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{'active' : activeContent === 'emotion-face'}" 
              @click="setActive('emotion-face')">Emotion Face</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{'active' : activeContent === 'emotion-face-demo'}" 
              @click="setActive('emotion-face-demo')">Emotion Face Demo</a>
          </li>
        </ul>
        <!-- <div id="face-recognition" class="content" 
          v-if="activeContent === 'face-recognition'">
          <FaceRecognition />
        </div>
        <div id="face-liveness" class="content"
          v-if="activeContent === 'face-liveness'">
          <FaceLiveness />
        </div> -->
        <div id="face-matching" class="content" 
          v-if="activeContent === 'face-matching'">
          <FaceMatchingReal />
          <!-- <FaceMatching /> -->
        </div>
        <div id="detection-face" class="content" 
          v-if="activeContent === 'detection-face'">
          <DetectionFace :isActive="activeContent === 'detection-face'" />
        </div>
        <div id="register-face" class="content" 
          v-if="activeContent === 'register-face'">
          <RegisterFace />
        </div>
        <div id="emotion-face" class="content"
          v-if="activeContent === 'emotion-face'">
          <EmotionFace :isActive="activeContent === 'emotion-face'"/>
        </div>
        <div id="emotion-face-demo" class="content"
          v-if="activeContent === 'emotion-face-demo'">
          <EmotionFaceDemo :isActive="activeContent === 'emotion-face-demo'"/>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import ImageBox from './components/ImageBox.vue';
import FaceRecognition from './views/FaceRecognition.vue';
import FaceLiveness from './views/FaceLiveness.vue';
import FaceMatching from './views/FaceMatching.vue';
import FaceMatchingReal from './views/FaceMatchingReal.vue';
import DetectionFace from './views/DetectionFace.vue';
import RegisterFace from './views/RegisterFace.vue';
import EmotionFace from './views/EmotionFace.vue';
import EmotionFaceDemo from './views/EmotionFaceDemo.vue';

//tab
const activeContent = ref("face-matching")
const setActive = (content) => {
    activeContent.value = content;
}
</script>

<style scoped>
.wrap{
  position: relative;
  width: 100%;
  height: 100vh;
}
.wrap-content{
  position: absolute;
}
.content{
  width: 100%;
  height: 100%;
  border: 1px #dedede solid;
  border-top: none ;
  margin: 0px 0px 24px;
  padding: 24px;
}
.nav-item{
  cursor: pointer;
  font-size: 14px;
}
.nav-link{
  color: #6b7280;
}
</style>
