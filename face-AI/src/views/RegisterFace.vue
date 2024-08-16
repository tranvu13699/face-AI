<template>
    <div>
        <h1>Register Face</h1>
        <div class="container wrap-container">
            <div class="input-text">Name: <input type="text" v-model="textInput" placeholder="Enter name here"></div>
            <video ref="video" width="640" height="480" autoplay></video>
            <canvas ref="canvas" width="640" height="480" hidden></canvas>

            <div v-if="currentOrientationMessage" class="orientation-message">
                <p>{{ currentOrientationMessage }}</p>
            </div>

            <div class="capture-all" v-if="!allPhotosCaptured">
                <button class="btn btn-capture-face" @click="captureAllPhotos">Start Register</button>
            </div>
            <div ref="photosContainer"></div>
            <button v-if="allPhotosCaptured" class="btn btn-register-face" @click="submitPhotos" :disabled="!allPhotosCaptured">Submit</button>
        </div>
    </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const textInput = ref('');
const video = ref(null);
const photosContainer = ref(null);
const capturedPhotos = ref([]);
const currentOrientationMessage = ref('');
const allPhotosCaptured = ref(false);

const orientationMessages = {
    left: 'Vui lòng quay mặt sang trái',
    right: 'Vui lòng quay mặt sang phải',
    up: 'Vui lòng ngước lên',
    down: 'Vui lòng nhìn xuống',
    straight: 'Vui lòng nhìn thẳng'
};

const orientations = ['left', 'right', 'up', 'down', 'straight'];

const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const startVideo = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.value.srcObject = stream;
    } catch (err) {
        console.error("Error accessing webcam: ", err);
    }
};

const capturePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = video.value.videoWidth;
    canvas.height = video.value.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video.value, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL('image/jpeg');

    // Display the captured photo
    // const img = document.createElement('img');
    // img.src = dataURL;
    // img.style.margin = '10px';
    // img.style.width = '100px';
    // photosContainer.value.appendChild(img);
    // // capturedPhotos.value.push(dataURL);
    // capturedPhotos.value[orientation] = dataURL;
    if (!dataURL) {
        console.error('Error capturing photo: dataURL is undefined or invalid.');
    }

    return dataURL;
};

const captureAllPhotos = async () => {
    allPhotosCaptured.value = true; // Đánh dấu bắt đầu chụp ảnh

    const orientationArray = shuffleArray(orientations);

    for (const orientation of orientationArray) {
        currentOrientationMessage.value = orientationMessages[orientation];
        let poseVerified = false;

        while (!poseVerified) {
            const photoData = capturePhoto();
            const formData = new FormData();
            formData.append('image', dataURLToBlob(photoData), `${orientation}.jpg`);

            try {
                console.log(orientation);
                const response = await axios.post('https://face.vn/check-pose', formData, {
                    params: { orientation: orientation },
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (response.data.status === 'success') {
                    poseVerified = true;
                    capturedPhotos.value[orientation] = photoData;

                    const img = document.createElement('img');
                    img.src = photoData;
                    img.style.margin = '10px';
                    img.style.width = '100px';
                    photosContainer.value.appendChild(img);
                    console.log(`Tư thế ${orientation} đúng.`);
                } else {
                    capturePhoto();
                    console.log(`Tư thế ${orientation} không đúng, yêu cầu thử lại.`);
                }
            } catch (error) {
                console.error('Lỗi khi kiểm tra tư thế:', error);
                // alert('Đã xảy ra lỗi khi kiểm tra tư thế. Vui lòng thử lại.');
                capturePhoto();
            }

            await new Promise(resolve => setTimeout(resolve, 500)); // Đợi 0.5 giây trước khi kiểm tra lại
        }
    }

    currentOrientationMessage.value = ''; // Xóa thông báo sau khi hoàn tất
    // allPhotosCaptured.value = true; // Đánh dấu bắt đầu chụp ảnh
};

const dataURLToBlob = (dataURL) => {
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
};

const resetForm = () => {
    textInput.value = '';
    capturedPhotos.value = [];
    photosContainer.value.innerHTML = '';
    currentOrientationMessage.value = '';
    allPhotosCaptured.value = false; // Cho phép chụp lại
};

const submitPhotos = () => {
    const name = textInput.value.trim();

    if (!name) {
        alert('Please enter a name.');
        return;
    }

    if (Object.keys(capturedPhotos.value).length < 5) {
        alert('Vui lòng chụp đủ 5 ảnh với các tư thế trước khi gửi.');
        return;
    }

    // if (capturedPhotos.value.length < 5) {
    //     alert('Please capture at least 5 photos before submitting.');
    //     return;
    // }

    axios.post('https://face.vn/register-face', {
        name: name,
        photos: capturedPhotos.value
    })
        .then(response => {
            console.log('Success:', response.data);
            alert('Photos successfully uploaded!');
            resetForm();
        })
        .catch(error => {
            console.error('Error:', error);
        });
};

onMounted(() => {
    startVideo()
});

</script>
<style scoped>
.wrap-container {
    margin-top: 30px;
}

.input-text {
    margin-bottom: 20px;
    font-weight: 600;
}

input {
    border-radius: 5px;
    border: 2px solid #ccc;
    padding: 5px 10px;
    font-weight: 600;
    outline: none;
    transition: border-color 0.3s ease;
}

input:focus {
    border-color: #457b9d;
}

.orientation-message {
    margin: 20px 0;
    font-weight: 600;
    font-size: 18px;
    color: #2c3e50;
}

.btn-capture-face {
    background: linear-gradient(to bottom right, #a8dadc, #457b9d);
    color: #1d3557;
    font-weight: 600;
    border: none;
    margin-top: 10px;
}

.btn-register-face {
    background: linear-gradient(to bottom right, #ffedd5, #fdba74);
    color: #ea580c;
    font-weight: 600;
    border: none;
    width: 50%;
    margin-top: 20px;
}
</style>