<template>
  <div v-if="!imageUrl || !isImg">
    <input type="file" @change="onImageSelected" hidden ref="fileInput" />
    <button class="btn btn-upload" @click="triggerFileInput">
      <i class="bi bi-upload"></i>
      <div class="text mt-2">
        <p class="mb-0">Drop Image Here</p>
        <p class="mb-0">-or-</p>
        <p>Click to Upload</p>
      </div>
    </button>
  </div>
  <div v-else class="wrap-img">
    <img class="img-upload w-100" :src="imageUrl" alt="img-upload" />
    <i @click="closeImg" class="bi bi-x-square icon-x-square"></i>
  </div>
</template>

<script setup>
import { ref, inject, defineEmits } from 'vue';

const toast = inject('toast');


const imageUrl = ref(null);
const fileInput = ref(null);
const isImg = ref(false)

function triggerFileInput() {
  fileInput.value.click();
}

const emit = defineEmits(['file-selected']);

// Hàm xử lý sự kiện file được chọn
function onImageSelected(event) {
  const files = event.target.files;
  if (files && files[0]) {
    const reader = new FileReader();

    const acceptedImageTypes = ['image/gif', 'image/jpeg', 'image/png', 'image/svg+xml'];
    if (!acceptedImageTypes.includes(files[0].type)) {
      toast.error('Lỗi tải ảnh. Vui lòng tải đúng định dạng ảnh!');
      return;
    }

    reader.onload = (e) => {
      // Cập nhật đường link preview của ảnh sau khi file được đọc thành công
      imageUrl.value = e.target.result;
      isImg.value = true;
      toast.success('Ảnh đã được tải lên thành công!');
    };
    // Đọc file dưới dạng URL
    reader.readAsDataURL(files[0]);
    emit('file-selected', files[0]);
  }
}

const closeImg = () => {
  isImg.value = false;
}
</script>

<style scoped>
.btn-upload {
  color: #6b7280;
  border: none;
}

.img-upload {
  max-height: 250px;
  object-fit: contain;
}

.icon-x-square {
  position: absolute;
  top: 10px;
  right: 10px;
}
</style>