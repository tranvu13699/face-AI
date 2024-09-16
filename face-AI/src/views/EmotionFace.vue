<!-- Sử dụng Onnx-->
<!-- <template>
    <div class="emotion-face">
        <video ref="videoElement" width="640" height="480" class="wrap-video" autoplay hidden></video>
        <div class="canvas-wrap">
            <canvas id="videoCanvas" ref="videoCanvas"></canvas>
            <canvas id="overlayCanvas" ref="overlayCanvas"></canvas>
        </div>
        <div>FPS: {{ fps }}</div>
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

const fps = ref(0);

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
        }
    } catch (error) {
        console.error("Error accessing webcam: ", error);
    }
}

const stopVideo = async () => {
    const video = videoElement.value;
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
}

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
        const response = await axios.post('https://face.vn/emotion-face-onnx', {
            image: frame,
        }, {
            headers: {
                'Content-Type': 'application/json',
                Accept: "*/*",
                'Access-Control-Allow-Origin': '*'
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error sending frame: ", error);
    }
}

const processFrames = () => {
    // let frameCount = 0;
    // let startTime = performance.now(); // Thời gian bắt đầu tính FPS
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
                            fps.value = result.fps;
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
    const faces = result.emotion_face;
    overlayContext.value.clearRect(0, 0, overlayContext.value.canvas.width, overlayContext.value.canvas.height);
    faces.forEach(face => {
        const [x1, y1, x2, y2] = face.box;
        overlayContext.value.font = "32px Arial";
        overlayContext.value.fillStyle = "red";
        overlayContext.value.fillText(face.name, x1, y1 - 10); // Adjust position for the name
        overlayContext.value.lineWidth = 3;
        overlayContext.value.strokeStyle = "red";
        overlayContext.value.strokeRect(x1, y1, x2 - x1, y2 - y1);
    })
}

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
</style> -->


<!-- Sử dụng tensorRT và WebSocket và Thread vẽ box trên FE-->
<template>
    <div class="emotion-face">
        <video ref="videoElement" width="640" height="480" class="wrap-video" autoplay hidden></video>
        <div class="canvas-wrap">
            <canvas id="videoCanvas" ref="videoCanvas"></canvas>
            <canvas id="overlayCanvas" ref="overlayCanvas"></canvas>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import DetectRTC from 'detectrtc';

const videoElement = ref(null);
const videoCanvas = ref(null);
const overlayCanvas = ref(null);

const videoContext = ref(null);
const overlayContext = ref(null);

const lastFrameTime = ref(0);
const lastApiCallTime = ref(0);
const apiCallInterval = 100; // Call API every 0.1 seconds

const socket = ref(null);

const fps = ref(0);
const frameCount = ref(0);
let fpsIntervalId = ref(null);

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
            console.log("bbbbb");
            setupCanvases();
            processFrames();
            calculateFps(); // Bắt đầu tính FPS
        }
    } catch (error) {
        console.error("Error accessing webcam: ", error);
    }
}

const stopVideo = async () => {
    const video = videoElement.value;
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    if (socket.value) {
        socket.value.close();
        socket.value = null;
    }
    if (fpsIntervalId) {
        clearInterval(fpsIntervalId); // Dừng tính FPS khi không cần thiết
    }
}

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

const setupWebSocket = () => {
    socket.value = new WebSocket("wss://face.vn/ws/emotion-face-tensor");

    socket.value.onopen = () => {
        console.log("WebSocket connection established");
    };

    socket.value.onmessage = (event) => {
        const result = JSON.parse(event.data);
        console.log(result);
        if (result && result.emotion_face) {
            drawBoundingBoxes(result);
        }
    };

    socket.value.onerror = (error) => {
        console.error("WebSocket error: ", error);
    };

    socket.value.onclose = () => {
        console.log("WebSocket connection closed");
        fps.value = 0;
        setupWebSocket()
    };
};

const sendFrame = async (frame) => {
    // if (DetectRTC.hasWebcam === true) { 
        if (socket.value && socket.value.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({ image: frame });
            console.log("aaaaaaaaaaaaa");
            socket.value.send(message);
        }
    // } else {
    //     console.log("Please install an external webcam device");
    // }
}

// const processFrames = () => {
//     const captureFrame = async (timestamp) => {
//         if (videoContext.value && videoElement.value && videoCanvas.value) {
//             videoContext.value.drawImage(videoElement.value, 0, 0, videoCanvas.value.width, videoCanvas.value.height);
//         }
//         if (!lastFrameTime.value || timestamp - lastFrameTime.value >= 1000 / 30) { // Draw every 1/30 second
//             if (videoCanvas.value) {
//                 const frame = videoCanvas.value.toDataURL("image/jpeg", 1.0);
//                 if (timestamp - lastApiCallTime.value >= apiCallInterval) {
//                     sendFrame(frame);
//                     lastApiCallTime.value = timestamp;
//                 }
//                 lastFrameTime.value = timestamp;
//             }
//         }

//         if (props.isActive) {
//             requestAnimationFrame(captureFrame); // Call function again after drawing
//         }
//     };
//     if (props.isActive) {
//         requestAnimationFrame(captureFrame); // Start the loop
//     }
// };

const processFrames = () => {
    
    const captureFrame = async (timestamp) => {
        if (videoContext.value && videoElement.value && videoCanvas.value) {
            videoContext.value.drawImage(videoElement.value, 0, 0, videoCanvas.value.width, videoCanvas.value.height);
        }

        // Kiểm tra khoảng thời gian giữa các lần gửi API
        if (!lastFrameTime.value || timestamp - lastFrameTime.value >= 1000 / 30) { // Vẽ mỗi 1/30 giây
            if (videoCanvas.value) {
                const frame = videoCanvas.value.toDataURL("image/jpeg", 1.0);
                if (timestamp - lastApiCallTime.value >= apiCallInterval) {
                    sendFrame(frame);
                    lastApiCallTime.value = timestamp;
                }
                lastFrameTime.value = timestamp;
                frameCount.value += 1; // Đếm số khung hình
            }
        }

        // Tiếp tục vòng lặp
        if (props.isActive) {
            requestAnimationFrame(captureFrame);
        }
    };

    if (props.isActive) {
        requestAnimationFrame(captureFrame); // Bắt đầu vòng lặp
    }
};


const drawBoundingBoxes = (result) => {
    const faces = result.emotion_face;
    overlayContext.value.clearRect(0, 0, overlayContext.value.canvas.width, overlayContext.value.canvas.height);
    faces.forEach(face => {
        const [x1, y1, x2, y2] = face.box;
        overlayContext.value.font = "32px Arial";
        overlayContext.value.fillStyle = "red";
        overlayContext.value.fillText(face.name, x1, y1 - 10); // Adjust position for the name
        overlayContext.value.lineWidth = 3;
        overlayContext.value.strokeStyle = "red";
        overlayContext.value.strokeRect(x1, y1, x2 - x1, y2 - y1);
    })

    // Vẽ FPS lên góc trên bên trái của canvas
    overlayContext.value.font = "24px Arial";
    overlayContext.value.fillStyle = "green";
    overlayContext.value.fillText(`FPS: ${fps.value}`, 10, 80);
}

const calculateFps = () => {
    fpsIntervalId = setInterval(() => {
        fps.value = frameCount.value; // Cập nhật FPS mỗi giây
        frameCount.value = 0; // Reset số khung hình sau mỗi giây
    }, 1000); // Cập nhật FPS mỗi giây
};

onMounted(() => {
    if (props.isActive) {
        setupWebSocket();
        startVideo();
    } else {
        stopVideo();
    }
});

onUnmounted(() => {
    stopVideo();
});
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
</style>


<!-- Sử dụng tensorRT và WebSocket vẽ box trên BE-->
<!-- <template>
    <div class="emotion-face">
        <video ref="videoElement" width="640" height="480" class="wrap-video" autoplay hidden></video>
        <div class="canvas-wrap">
            <canvas id="videoCanvas" ref="videoCanvas" hidden></canvas>
            <canvas id="overlayCanvas" ref="overlayCanvas"></canvas>
        </div>
        <div>FPS: {{ fps }}</div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const videoElement = ref(null);
const videoCanvas = ref(null);
const overlayCanvas = ref(null);

const videoContext = ref(null);
const overlayContext = ref(null);

const lastFrameTime = ref(0);
const lastApiCallTime = ref(0);
const apiCallInterval = 100; // Call API every 0.1 seconds

const fps = ref(0);
const socket = ref(null);

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
        }
    } catch (error) {
        console.error("Error accessing webcam: ", error);
    }
}

const stopVideo = async () => {
    const video = videoElement.value;
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    if (socket.value) {
        socket.value.close();
        socket.value = null;
    }
}

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

const setupWebSocket = () => {
    socket.value = new WebSocket("wss://face.vn/ws/emotion-face-tensor");

    socket.value.onopen = () => {
        console.log("WebSocket connection established");
    };

    socket.value.onmessage = (event) => {
        const result = JSON.parse(event.data);
        if (result.fps) {
            fps.value = result.fps.toFixed(2); // Cập nhật giá trị FPS từ backend
        }
        if (result.image) {
            drawImageFromBase64(result.image); // Hiển thị ảnh đã xử lý
        }
    };

    socket.value.onerror = (error) => {
        console.error("WebSocket error: ", error);
    };

    socket.value.onclose = () => {
        console.log("WebSocket connection closed");
        setupWebSocket();
    };
};

const sendFrame = async (frame) => {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
        const message = JSON.stringify({ image: frame });
        socket.value.send(message);
    }
}

const processFrames = () => {
    const captureFrame = async (timestamp) => {
        if (videoContext.value && videoElement.value && videoCanvas.value) {
            videoContext.value.drawImage(videoElement.value, 0, 0, videoCanvas.value.width, videoCanvas.value.height);
        }
        if (!lastFrameTime.value || timestamp - lastFrameTime.value >= 1000 / 30) { // Draw every 1/30 second
            if (videoCanvas.value) {
                const frame = videoCanvas.value.toDataURL("image/jpeg", 1.0);
                if (timestamp - lastApiCallTime.value >= apiCallInterval) {
                    sendFrame(frame);
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

const drawImageFromBase64 = (base64Image) => {
    const img = new Image();
    img.src = `data:image/jpeg;base64,${base64Image}`;
    img.onload = () => {
        const overlayCtx = overlayCanvas.value.getContext('2d');
        overlayCtx.clearRect(0, 0, overlayCanvas.value.width, overlayCanvas.value.height);
        overlayCtx.drawImage(img, 0, 0, overlayCanvas.value.width, overlayCanvas.value.height);
    }
}

onMounted(() => {
    if (props.isActive) {
        startVideo();
        setupWebSocket();
    }
});

onUnmounted(() => {
    stopVideo();
});
</script>

<style>
.canvas-wrap {
    position: relative;
}
</style> -->