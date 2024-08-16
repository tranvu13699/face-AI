<template>
    <div>
        <div v-if="!isCameraOn && !isPhoto" @click="startCamera">
            <i class="bi bi-camera"></i>
            <div class="text mt-2">
                <p class="mb-0">Click to Access Webcam</p>
            </div>
        </div>
        <div class="header-box d-flex justify-content-between align-items-center" v-else>
            <p class="mb-0 ps-2">{{ isCameraOn ? 'Camera' : 'Image'  }}</p>
            <i v-if="isCameraOn " @click="stopCamera" class="bi bi-x-square icon-x-square"></i>
            <i v-if="isPhoto" @click="closeImg" class="bi bi-x-square icon-x-square"></i>
        </div>
    </div>
    <video ref="videoRef" v-show="isCameraOn" class="video w-100" autoplay></video>
    <canvas class="d-none" v-show="!isCameraOn" ref="canvasRef" id="canvas"></canvas>
    <div v-show="isPhoto" class="output h-100 w-100">
        <img class="capture-photo w-100" ref="photoRef" id="photo" alt="capture-photo" />
    </div>
    <div class="mx-auto mt-3">
        <div class="group-btn d-flex justify-content-center align-items-center gap-2" v-if="isCameraOn">
                <i class="btn-capture bi bi-camera" @click="captureImg"></i>
                <i class="btn-dropdown bi bi-chevron-down" @click="toggle" @blur="!isActive"></i>
                <div class="dropdown-device" v-if="isActive">
                    <div class="device" v-for="device in videoDevices"  
                        :key="device.deviceId" @click="changeDevice(device.deviceId)">
                        {{ device.label }}
                    </div>
                </div>
            </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineEmits } from 'vue';

const isActive = ref(false);

const toggle = ()=>{
    isActive.value = !isActive.value;
}

const emit = defineEmits(['file-selected']);

//camera
const videoRef = ref(null);
const canvasRef = ref(null);
const photoRef = ref(null);
const isCameraOn = ref(false);
const isPhoto = ref(false);
let stream = null;
const videoDevices = ref([]);
const selectedDeviceId = ref(null);

const startCamera = async () => {
  try {
    if (videoRef.value) {
      // Thêm event listener trước khi bắt đầu stream
      videoRef.value.addEventListener('loadedmetadata', () => {
        var width = videoRef.value.videoWidth;
        var height = videoRef.value.videoHeight;
      });

      stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedDeviceId.value ? { exact: selectedDeviceId.value } : undefined,
                width: { ideal: 1280 },
                height: { ideal: 720 } }
      });
      videoRef.value.srcObject = stream;
      isCameraOn.value = true;
      isPhoto.value = false;
    }
  } catch (error) {
    console.error('Lỗi khi truy cập camera', error);
  }
};

const stopCamera = () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        isCameraOn.value = false;
    }
};

const captureImg = () => {
  if (videoRef.value && canvasRef.value) {
    if (videoRef.value.videoWidth === 0 || videoRef.value.videoHeight === 0) {
      console.error('Kích thước video không xác định');
      return;
    }
    const context = canvasRef.value.getContext('2d');
    canvasRef.value.width = videoRef.value.videoWidth;
    canvasRef.value.height = videoRef.value.videoHeight;

    context.translate(canvasRef.value.width, 0);
    context.scale(-1, 1);
    // Vẽ video lên canvas
    context.drawImage(videoRef.value, 0, 0, canvasRef.value.width, canvasRef.value.height);
    const data = canvasRef.value.toDataURL('image/png');
    if (photoRef.value) {
      photoRef.value.src = data;
      isPhoto.value = true;
      isCameraOn.value = false;
      emit('file-selected', dataURLtoFile(data, 'photo.png'));
    }
    stopCamera();
  } else {
    console.error('Thiếu tham chiếu đến video và/hoặc canvas');
  }
};

const closeImg = ()=>{
    isPhoto.value = false;
}

const getAllDevice = async () => {
    try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    videoDevices.value = devices.filter(device => device.kind === 'videoinput');
    if (videoDevices.value.length > 0 && !selectedDeviceId.value) {
      selectedDeviceId.value = videoDevices.value[0].deviceId;
    }
  } catch (error) {
    console.error("Không thể lấy danh sách webcam:", error);
  }
};

const changeDevice = (deviceId) => {
  selectedDeviceId.value = deviceId;
  startCamera();
  toggle();
};

const dataURLtoFile = (dataurl, filename) => {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

onMounted(() => {
    getAllDevice();
});

onUnmounted(() => {
    stopCamera();
});
</script>

<style scoped>
.content{
    cursor: pointer;
}
.content i{
    font-size: 24px;
}
.header-box{
    /* max-height: 100px; */
    font-size: 12px;
    color: #6b7280;
}
.header-box i{
    font-size: 16px;
}
.video{
    transform: scaleX(-1);
    max-height: 230px;
    object-fit: contain;
}
.group-btn{
    position: relative;
    padding: 4px 12px;
    border: 1px #dedede solid;
    border-radius: 10px;
    width: max-content;
}
.btn-capture,.btn-dropdown{
    font-size: 16px!important;
}
.device{
    font-size: 12px;
    padding: 0px 8px;
}
.device:hover{
    background: #dedede;
}
.dropdown-device{
    position: absolute;
    top: 34px;
    background: #ffffff;
    border: 1px #333333 solid;
    border-radius: 10px;
    width: max-content;
    overflow: hidden;
}
.capture-photo {
  max-height: 250px;
  height: 100%;
  object-fit: contain;
}
</style>