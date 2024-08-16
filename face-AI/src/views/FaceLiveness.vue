<template>
    <div class="h-100 container">
        <div class="row row-gap-4">
            <div class="col-12 col-md-6 d-flex justify-content-center">
                <ImageBox />
            </div>
            <div class="col-12 col-md-6 d-flex flex-column align-items-center gap-4">
                <button class="w-100 btn btn-analyze">Analyze Face</button> 
                <div class="face">
                    <div class="d-flex gap-2 face-title">
                        <i class="bi bi-image"></i>
                        <span>Face</span>
                    </div>
                    <i  class="bi bi-x-square icon-x-square"></i>
                </div> 
                <div class="result w-100">
                    <div class="result-score error py-3">
                        <p class="mb-0">Liveness Check: SPOOF</p>
                        <p class="mb-0">Score: -4.584274768829346</p>
                    </div>
                    <div class="result-table">
                        
                    </div>
                </div> 
            </div>
        </div>
  </div>
</template>

<script setup>
import ImageBox from '../components/ImageBox.vue';
</script>

<style scoped>
.btn-analyze{
    background: linear-gradient(to bottom right, #ffedd5, #fdba74);
    color: #ea580c;
    font-weight: 600;
    border: none;
}
.face{
    position: relative;
    height: 48px;
    width: 48px;
    padding: 70px;
    border: 1px #dedede solid;
    border-radius: 10px;
    color: #6b7280;
}
.face-title{
    position: absolute;
    top: 0;
    left: 0;
    font-size: 11px;
    padding: 4px 8px;
    border-bottom: 1px #dedede solid;
    border-right: 1px #dedede solid;
    border-bottom-right-radius: 10px;
}
.icon-x-square{
    position: absolute;
    top: 0;
    right: 0;
    padding: 4px 8px;
    cursor: pointer;
}
.icon-x-square:hover{
    color: red;
}
.result-score.error{
    background: rgb(255, 241, 240);
    border: 1px red solid;
    color: red;
}
.result-score.correct{
    background: rgb(246, 255, 237);
    border: 1px green solid;
    color: green;
}
</style>