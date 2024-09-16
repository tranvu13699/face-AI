<template>
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
import * as ort from 'onnxruntime-web';
ort.env.wasm.wasmPaths = "node_modules/onnxruntime-web/dist/";

// Refs for video and canvas elements
const videoElement = ref(null);
const videoCanvas = ref(null);
const overlayCanvas = ref(null);

const videoContext = ref(null);
const overlayContext = ref(null);

const lastFrameTime = ref(0);
const fps = ref(0);
const model = ref(null);

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

const loadModel = async () => {
    model.value = await ort.InferenceSession.create('./src/model/emotion.onnx', {
        backendHint: 'webgl', // or 'webgl' if you prefer WebGL backend
    });
    console.log(model.value);

    // const inputNames = model.value.inputNames;
    // console.log("Model input names: ", inputNames);
}

const processFrames = () => {
    const captureFrame = async (timestamp) => {
        if (videoContext.value && videoElement.value && videoCanvas.value) {
            videoContext.value.drawImage(videoElement.value, 0, 0, videoCanvas.value.width, videoCanvas.value.height);
        }
        if (!lastFrameTime.value || timestamp - lastFrameTime.value >= 1000 / 10) {
            if (videoCanvas.value) {
                const frame = videoCanvas.value.toDataURL("image/jpeg", 1.0);
                const img = new Image();
                img.src = frame;
                img.onload = async () => {
                    // console.log(model.value);
                    if (model.value) {
                        const tensor = preprocessImage(img);
                        const result = await runInference(tensor);
                        console.log(result);
                        drawBoundingBoxes(result);
                    } else {
                        console.log("Model chưa được tải");
                    }
                };
                lastFrameTime.value = timestamp;
            }
        }
        if (props.isActive) {
            requestAnimationFrame(captureFrame);
        }
    };
    if (props.isActive) {
        requestAnimationFrame(captureFrame);
    }
};

const preprocessImage = (img) => {
    const canvas = document.createElement('canvas');
    const width = 640;  // Kích thước yêu cầu của mô hình
    const height = 640;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.drawImage(img, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);

    // Chuyển đổi dữ liệu ảnh thành tensor
    const data = new Float32Array(width * height * 3); // RGB
    const { data: pixelData } = imageData;
    
    for (let i = 0; i < pixelData.length; i += 4) {
        data[i / 4 * 3] = pixelData[i] / 255;       // Red
        data[i / 4 * 3 + 1] = pixelData[i + 1] / 255; // Green
        data[i / 4 * 3 + 2] = pixelData[i + 2] / 255; // Blue
    }

    // Convert to tensor
    const tensor = new ort.Tensor('float32', data, [1, 3, height, width]);
    return tensor;
};

const runInference = async (tensor) => {
    const output = await model.value.run({ images: tensor });
    console.log(output);
    return output; 
};

const drawBoundingBoxes = (result) => {
    const faces = result["output0"].data;
    console.log(faces);
    const canvasWidth = overlayCanvas.value.width;
    const canvasHeight = overlayCanvas.value.height;
    
    overlayContext.value.clearRect(0, 0, canvasWidth, canvasHeight);

    for (let i = 0; i < faces.length; i += 6) {
        const [x, y, width, height, confidence, emotionIndex] = faces.slice(i, i + 6);

        if (confidence > 0.5) {  // Chỉ vẽ những khuôn mặt có độ tự tin > 0.5
            const x1 = x * canvasWidth;
            const y1 = y * canvasHeight;
            const x2 = (x + width) * canvasWidth;
            const y2 = (y + height) * canvasHeight;

            overlayContext.value.lineWidth = 3;
            overlayContext.value.strokeStyle = "red";
            overlayContext.value.strokeRect(x1, y1, x2 - x1, y2 - y1);

            overlayContext.value.font = "32px Arial";
            overlayContext.value.fillStyle = "red";
            overlayContext.value.fillText(`Emotion: ${emotionIndex}`, x1, y1 - 10);
        }
    }
    // console.log(result);
    // const faces = result["output0"].data;
    // console.log(faces);
    // overlayContext.value.clearRect(0, 0, overlayContext.value.canvas.width, overlayContext.value.canvas.height);
    // for (let i = 0; i < faces.length; i += 6) {
    //     // Trích xuất dữ liệu khuôn mặt từ mảng phẳng
    //     const [x, y, width, height, confidence, emotionIndex] = faces.slice(i, i + 6);

    //     // Chuyển đổi tọa độ bounding box từ phạm vi [0, 1] thành giá trị pixel
    //     const canvasWidth = overlayCanvas.value.width;
    //     const canvasHeight = overlayCanvas.value.height;
    //     const x1 = x * canvasWidth;
    //     const y1 = y * canvasHeight;
    //     const x2 = (x + width) * canvasWidth;
    //     const y2 = (y + height) * canvasHeight;

    //     // Vẽ bounding box
    //     overlayContext.value.font = "32px Arial";
    //     overlayContext.value.fillStyle = "red";
    //     overlayContext.value.fillText(`Emotion: ${emotionIndex}`, x1, y1 - 10);
    //     overlayContext.value.lineWidth = 3;
    //     overlayContext.value.strokeStyle = "red";
    //     overlayContext.value.strokeRect(x1, y1, x2 - x1, y2 - y1);
    // }

    // faces.forEach(face => {
    //     const [x1, y1, x2, y2] = face.box;
    //     overlayContext.value.font = "32px Arial";
    //     overlayContext.value.fillStyle = "red";
    //     overlayContext.value.fillText(face.emotion, x1, y1 - 10);
    //     overlayContext.value.lineWidth = 3;
    //     overlayContext.value.strokeStyle = "red";
    //     overlayContext.value.strokeRect(x1, y1, x2 - x1, y2 - y1);
    // });
};

onMounted(async() => {
    if (props.isActive) {
        await loadModel();
        startVideo();
    } else {
        stopVideo();
    }
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