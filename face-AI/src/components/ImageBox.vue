<template>
    <div class="w-100 img-box d-flex flex-column justify-content-center align-items-center gap-3">
        <div id="upload" class="flex-grow-1 d-flex flex-column justify-content-center content"
            v-if="activeContent === 'upload'">
            <Upload @file-selected="handleFileSelected"/>
        </div>
        <div id="camera" class="flex-grow-1 d-flex flex-column justify-content-center content"
            v-if="activeContent === 'camera'">
            <Camera @file-selected="handleFileSelected"/>
        </div>
        <!-- <div id="clipboard" class="flex-grow-1 d-flex flex-column justify-content-center content"
            v-if="activeContent === 'clipboard'">
            <ClipBoard />
        </div> -->
        <div class="group-btn d-flex justify-content-center gap-3">
            <i v-if="initialContent === 'upload'" :class="{ 'active': activeContent === 'upload' }" class="bi bi-upload" @click="setActive('upload')"></i>
            <i v-if="initialContent === 'camera'" :class="{ 'active': activeContent === 'camera' }" class="bi bi-camera" @click="setActive('camera')"></i>
            <!-- <i :class="{ 'active': activeContent === 'clipboard' }" class="bi bi-clipboard"
                @click="setActive('clipboard')"></i> -->
        </div>
    </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';
import Camera from './Camera.vue';
import ClipBoard from './ClipBoard.vue';
import Upload from './Upload.vue';

const props = defineProps({
    initialContent: {
        type: String,
        required: true
    }
});

const emit = defineEmits(['file-selected']);

const activeContent = ref(props.initialContent);
const setActive = (content) => {
    activeContent.value = content;
};

const handleFileSelected = (file) => {
    emit('file-selected', file);
};


</script>

<style scoped>
.img-box {
    height: 100%;
    max-height: 370px;
    max-width: 400px;
    min-height: 370px;
    min-width: 300px;
    border: 1px #dedede dashed;
    border-radius: 10px;
    color: #6b7280;
    padding: 12px;
    position: relative;
}

.content {
    cursor: pointer;
}

.content i {
    font-size: 24px;
}

.group-btn {
    padding: 12px 24px 0 24px;
    border-top: 1px #dedede solid;
    width: max-content !important;
}

.group-btn i {
    font-size: 16px;
    cursor: pointer;
}

.group-btn i.active {
    color: #f97316;
}
</style>