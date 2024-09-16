<template>
    <div class="container">
        <h1 class="my-3">Simple - Real time face detection</h1>
        <form @submit.prevent="startDetection">
            <div class="input-group mb-3">
                <select v-model="selectedCamera" class="form-select">
                    <option v-for="camera in cameras" :key="camera.deviceId" :value="camera.deviceId">
                        {{ camera.label }}
                    </option>
                </select>
                <button class="btn btn-success" type="submit">Start</button>
            </div>
        </form>
        <div class="position-relative">
            <video ref="video" class="video"></video>
            <canvas ref="canvas" class="position-absolute top-0 start-0"></canvas>
        </div>
    </div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const video = ref(null);
const canvas = ref(null);
const cameras = ref([]);
const selectedCamera = ref(null);
let socket = null;
let intervalId = null;

const IMAGE_INTERVAL_MS = 42;

const drawFaceRectangles = (videoElement, canvasElement, faces) => {
    const ctx = canvasElement.getContext('2d');
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    faces.faces.forEach(([x, y, width, height]) => {
        ctx.strokeStyle = '#49fb35';
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.stroke();
    });
};

const startFaceDetection = (deviceId) => {
    socket = new WebSocket('wss://face.vn/face-detection');

    socket.addEventListener('open', () => {
        navigator.mediaDevices
            .getUserMedia({
                audio: false,
                video: { deviceId, width: { max: 640 }, height: { max: 480 } },
            })
            .then((stream) => {
                video.value.srcObject = stream;
                video.value.play().then(() => {
                    canvas.value.width = video.value.videoWidth;
                    canvas.value.height = video.value.videoHeight;

                    intervalId = setInterval(() => {
                        const tempCanvas = document.createElement('canvas');
                        const ctx = tempCanvas.getContext('2d');
                        tempCanvas.width = video.value.videoWidth;
                        tempCanvas.height = video.value.videoHeight;
                        ctx.drawImage(video.value, 0, 0);

                        tempCanvas.toBlob((blob) => {
                            if (blob && socket.readyState === WebSocket.OPEN) {
                                socket.send(blob);
                            }
                        }, 'image/jpeg');
                    }, IMAGE_INTERVAL_MS);
                });
            });
    });

    socket.addEventListener('message', (event) => {
        drawFaceRectangles(video.value, canvas.value, JSON.parse(event.data));
    });

    socket.addEventListener('close', () => {
        clearInterval(intervalId);
        if (video.value) {
            video.value.pause();
        }
    });

    socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        // Kiểm tra trạng thái WebSocket và thông báo cho người dùng
        if (socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
            alert('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối của bạn hoặc thử lại sau.');
        } else {
            alert('Lỗi WebSocket không xác định. Vui lòng thử lại sau.');
        }
    });
};

const startDetection = () => {
    if (socket) {
        socket.close();
    }
    startFaceDetection(selectedCamera.value);
};

onMounted(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
        cameras.value = devices.filter((device) => device.kind === 'videoinput');
        if (cameras.value.length > 0) {
            selectedCamera.value = cameras.value[0].deviceId;
        }
    });
});

onBeforeUnmount(() => {
    if (socket) {
        socket.close();
    }
});

</script>
<style scoped>
.video {
    width: 100%;
    max-width: 640px;
}

canvas {
    width: 100%;
    height: auto;
}
</style>