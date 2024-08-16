<template>
    <div class="container wrap-container">
        <div class="row row-gap-4 justify-content-center align-items-center">
            <div class="col-12 col-md-6 d-flex justify-content-center">
                <ImageBox initialContent="upload" @file-selected="handleFileSelected1" />
            </div>
            <div class="col-12 col-md-6 d-flex justify-content-center">
                <ImageBox initialContent="camera" @file-selected="handleFileSelected2" />
            </div>
            <div class="col-12 col-md-6 d-flex justify-content-center">
                <button class="w-100 btn btn-compare-face" @click="compareFaces">Compare Face</button>
            </div>
            <div class="col-12 col-md-6 col-lg-4 d-flex justify-content-center align-items-center">
                <div v-if="similarityScore <= 0.85" class="result correct">Similarity score : {{ similarityScore }}</div>
                <div v-else class="result error">Similarity score : {{ similarityScore }}</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import ImageBox from '../components/ImageBox.vue';
import axios from 'axios';

const similarityScore = ref(0);
const file1 = ref(null);
const file2 = ref(null);
const base64File1 = ref(null);
const base64File2 = ref(null);


const handleFileSelected1 = (file) => {
    convertToBase64(file, (base64) => {
        base64File1.value = base64;
    });
};

const handleFileSelected2 = (file) => {
    convertToBase64(file, (base64) => {
        base64File2.value = base64;
    });
};

const convertToBase64 = (file, callback) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        callback(reader.result);
    };
    reader.onerror = (error) => {
        console.error('Error converting file to base64:', error);
    };
};

const compareFaces = async () => {
    if (!base64File1.value || !base64File2.value) {
        alert('Please select both files');
        return;
    }

    const formData = new FormData();
    formData.append('file1', base64File1.value);
    formData.append('file2', base64File2.value);

    try {
        const response = await axios.post('https://face.vn/compare-faces', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Accept: "*/*",
                'Access-Control-Allow-Origin': '*'
            }
        });
        similarityScore.value = response.data.distance;
    } catch (error) {
        console.error('Error uploading files:', error);
    }
};

</script>

<style>
.btn-compare-face {
    background: linear-gradient(to bottom right, #ffedd5, #fdba74);
    color: #ea580c;
    font-weight: 600;
    border: none;
}

.result {
    padding: 16px 48px;
    margin-right: 10px;
}

.result.correct {
    background: rgb(246, 255, 237);
    border: 1px green solid;
    color: green;
}

.result.error {
    background: rgb(255, 241, 240);
    border: 1px red solid;
    color: red;
}
</style>
