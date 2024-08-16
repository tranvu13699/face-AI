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
import * as ort from 'onnxruntime-web';

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
    model.value = await ort.InferenceSession.create('emotion.onnx', {
        backendHint: 'webassembly', // or 'webgl' if you prefer WebGL backend
    });
}

const processFrames = () => {
    const captureFrame = async (timestamp) => {
        if (videoContext.value && videoElement.value && videoCanvas.value) {
            videoContext.value.drawImage(videoElement.value, 0, 0, videoCanvas.value.width, videoCanvas.value.height);
        }
        if (!lastFrameTime.value || timestamp - lastFrameTime.value >= 1000 / 30) {
            if (videoCanvas.value) {
                const frame = videoCanvas.value.toDataURL("image/jpeg", 1.0);
                const img = new Image();
                img.src = frame;
                img.onload = async () => {
                    const tensor = preprocessImage(img);
                    const result = await runInference(tensor);
                    console.log(result);
                    drawBoundingBoxes(result);
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

// const run_model = async (input) => {
//     const model = await ort.InferenceSession.create("emotion.onnx", {
//         backendHint: 'webassembly', // or 'webgl' if you prefer WebGL backend
//     });
//     input = new ort.Tensor(Float32Array.from(input),[1, 3, 640, 640]);
//     const outputs = await model.run({images:input});
//     console.log(outputs);
//     return outputs["output0"].data;
// }

const preprocessImage = (img) => {
    const canvas = document.createElement('canvas');
    const width = 224;  // Kích thước yêu cầu của mô hình
    const height = 224;
    canvas.width = width; // Adjust according to your model's input size
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
    const output = await model.value.run({ input: tensor });
    return output; // Adjust according to the output format of your model
};

const drawBoundingBoxes = (result) => {
    const faces = result.emotion_face; // Adjust this according to your model's output
    overlayContext.value.clearRect(0, 0, overlayContext.value.canvas.width, overlayContext.value.canvas.height);
    faces.forEach(face => {
        const [x1, y1, x2, y2] = face.box;
        overlayContext.value.font = "32px Arial";
        overlayContext.value.fillStyle = "red";
        overlayContext.value.fillText(face.emotion, x1, y1 - 10);
        overlayContext.value.lineWidth = 3;
        overlayContext.value.strokeStyle = "red";
        overlayContext.value.strokeRect(x1, y1, x2 - x1, y2 - y1);
    });
};

onMounted(() => {
    if (props.isActive) {
        startVideo();
        loadModel();
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
</style> -->
<template>
    <div>
      <video ref="video" width="640" height="480" autoplay></video>
      <canvas ref="canvas" width="640" height="480"></canvas>
    </div>
  </template>
  
  <script>
  import * as ort from 'onnxruntime-web';
  
  export default {
    data() {
      return {
        session: null,
        video: null,
        canvas: null,
        context: null,
      };
    },
    async mounted() {
      this.video = this.$refs.video;
      this.canvas = this.$refs.canvas;
      this.context = this.canvas.getContext('2d');
  
      // Load the YOLOv8 ONNX model
      this.session = await ort.InferenceSession.create('/model/emotion.onnx', {
        backendHint: 'webassembly',
        executionProviders: ['cpu']
      });
  
      this.startVideo();
    },
    methods: {
      startVideo() {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then((stream) => {
            this.video.srcObject = stream;
            this.processFrame();
          })
          .catch((err) => {
            console.error("Error accessing the camera", err);
          });
      },
      async processFrame() {
        if (!this.video || !this.session) return;
  
        // Draw the video frame on the canvas
        this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
  
        // Preprocess the image data for YOLOv8 model
        const tensor = this.preprocess(imageData);
  
        // Run the model inference
        const results = await this.session.run({ input: tensor });
  
        // Postprocess the results and draw the bounding boxes
        this.postprocess(results);
  
        // Continue processing the next frame
        requestAnimationFrame(this.processFrame);
      },
      preprocess(imageData) {
        // Convert the image data to a tensor and normalize it as required by YOLOv8
        const tensor = new Float32Array(imageData.width * imageData.height * 3);
        for (let i = 0; i < imageData.data.length; i += 4) {
          tensor[i] = imageData.data[i] / 255.0; // R
          tensor[i + 1] = imageData.data[i + 1] / 255.0; // G
          tensor[i + 2] = imageData.data[i + 2] / 255.0; // B
        }
        return new ort.Tensor('float32', tensor, [1, 3, imageData.height, imageData.width]);
      },
      postprocess(results) {
        // Extract bounding boxes and class predictions from the model's output
        const boxes = results['output_boxes'];
        const scores = results['output_scores'];
        const classes = results['output_classes'];
  
        // Draw the bounding boxes on the canvas
        this.context.strokeStyle = 'red';
        this.context.lineWidth = 2;
        for (let i = 0; i < boxes.dims[0]; i++) {
          const [x1, y1, x2, y2] = boxes.data.slice(i * 4, i * 4 + 4);
          this.context.strokeRect(x1, y1, x2 - x1, y2 - y1);
          this.context.fillText(classes.data[i], x1, y1 - 5);
        }
      },
    },
  };
  </script>
  
  <style>
  video, canvas {
    border: 1px solid #000;
  }
  </style>
