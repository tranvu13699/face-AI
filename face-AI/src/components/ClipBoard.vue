<template>
   <div>
        <div id="pasteArea" @paste.prevent="handlePaste" v-if="!pastedImage" >
            <i class="bi bi-clipboard"></i>
            <div class="text mt-2">
                <p class="mb-0">Paste from Clipboard</p>
            </div>
        </div>
        <img v-else class="w-100" :src="pastedImage" alt="Pasted Image" />
  </div>
</template>

<script setup>
import { ref } from "vue";

const pastedImage = ref(null);

const handlePaste = async (event) => {
  event.preventDefault();
  const clipboardItems = typeof navigator?.clipboard?.read === 'function' ? await navigator.clipboard.read() : event.clipboardData.items;

  for (const clipboardItem of clipboardItems) {
    let blob;
    if (clipboardItem.type?.startsWith('image/')) {
      blob = clipboardItem.getAsFile ? clipboardItem.getAsFile() : clipboardItem;
      appendImage(blob);
    } else if (clipboardItem.types?.includes('image/png') || clipboardItem.types?.includes('image/jpeg')) {
      const imageTypes = clipboardItem.types?.filter(type => type.startsWith('image/'));
      for (const imageType of imageTypes) {
        blob = await clipboardItem.getType(imageType);
        appendImage(blob);
      }
    }
  }
};
const appendImage = (blob) => {
    pastedImage.value = URL.createObjectURL(blob);
};
</script>

<style>
#pasteArea i{
    font-size: 24px;
}
</style>