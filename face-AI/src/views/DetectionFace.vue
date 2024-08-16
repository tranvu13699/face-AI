<template>
    <div class="face-detection">
        <video ref="videoElement" width="640" height="480" class="wrap-video" autoplay hidden></video>
        <div class="canvas-wrap">
            <canvas id="videoCanvas" ref="videoCanvas"></canvas>
            <canvas id="overlayCanvas" ref="overlayCanvas"></canvas>
        </div>
    </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const videoElement = ref(null);
const videoCanvas = ref(null);
const overlayCanvas = ref(null);
const videoContext = ref(null);
const overlayContext = ref(null);
const lastFrameTime = ref(0);
const lastApiCallTime = ref(0);
const apiCallInterval = 400; // Call API every 0.4 seconds

const props = defineProps({
    isActive: Boolean
})

const startVideo = async () => {
    const video = videoElement.value;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.play();
        video.onloadeddata = () => {
            setupCanvases();
            processFrames();
        };
    } catch (err) {
        console.error("Error accessing webcam: ", err);
    }
};

const stopVideo = () => {
  const video = videoElement.value;
  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }
};

const setupCanvases = () => {
    if (videoElement.value && videoCanvas.value && overlayCanvas.value) {
        videoCanvas.value.width = videoElement.value.videoWidth;
        videoCanvas.value.height = videoElement.value.videoHeight;
        overlayCanvas.value.width = videoElement.value.videoWidth;
        overlayCanvas.value.height = videoElement.value.videoHeight;
        videoContext.value = videoCanvas.value.getContext('2d');
        overlayContext.value = overlayCanvas.value.getContext('2d');
    }
};

const sendFrame = async (frame) => {
    try {
        const response = await axios.post('https://face.vn/recognize', {
            image: frame,
        }, {
            headers: {
                'Content-Type': 'application/json',
                Accept: "*/*",
                'Access-Control-Allow-Origin': '*'
            },
        });
        return response.data;
    } catch (err) {
        console.error("Error sending frame: ", err);
    }
};

const processFrames = () => {
    const captureFrame = async (timestamp) => {
        if (videoContext.value && videoElement.value && videoCanvas.value) {
            videoContext.value.drawImage(videoElement.value, 0, 0, videoCanvas.value.width, videoCanvas.value.height);
        }
        if (!lastFrameTime.value || timestamp - lastFrameTime.value >= 1000 / 30) { // Draw every 1/30 second
            if (videoCanvas.value) {
                const frame = videoCanvas.value.toDataURL("image/jpeg", 1.0);
                if (timestamp - lastApiCallTime.value >= apiCallInterval) {
                    sendFrame(frame).then(result => {
                        if (result) {
                            drawBoundingBoxes(result);
                        }
                    });
                    lastApiCallTime.value = timestamp;
                }
                lastFrameTime.value = timestamp;
            }
        }
        if (props.isActive) {
            requestAnimationFrame(captureFrame); // Call function again after drawing
        }
    };
    if (props.isActive) {
        requestAnimationFrame(captureFrame); // Start the loop
    }
};

const drawBoundingBoxes = (result) => {
    const faces = result.recognized_faces;
    // Clear the previous frame's bounding boxes
    overlayContext.value.clearRect(0, 0, overlayContext.value.canvas.width, overlayContext.value.canvas.height);
    faces.forEach(face => {
        const [x1, y1, x2, y2] = face.box;
        overlayContext.value.font = "32px Arial";
        overlayContext.value.fillStyle = "red";
        overlayContext.value.fillText(face.name, x1, y1 - 10); // Adjust position for the name
        overlayContext.value.lineWidth = 3;
        overlayContext.value.strokeStyle = "red";
        overlayContext.value.strokeRect(x1, y1, x2 - x1, y2 - y1);
        overlayCanvas.value = ""
    })
};

onMounted(() => {
    if (props.isActive) {
        startVideo();
    } else {
        stopVideo();
    }
})

</script>
<style scoped>
#overlayCanvas {
    position: absolute;
}

.canvas-wrap {
    position: relative;
    display: inline-block;
}

.canvas-wrap canvas {
    top: 0;
    left: 0;
}

/* .btn-register {
    margin-top: 30px;
} */

/* .btn-register-face {
    background: linear-gradient(to bottom right, #ffedd5, #fdba74);
    color: #ea580c;
    font-weight: 600;
    border: none;
} */
</style>