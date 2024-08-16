<template>
  <div class="container">
    <div class="row row-gap-4">
        <div class="col-12 col-md-8 col-lg-6 d-flex flex-column gap-4">
            <button class="w-100 btn btn-compare-face">Compare Face</button>
            <div class="d-flex justify-content-evenly align-items-center">
                <div class="face">
                    <div class="d-flex gap-2 face-title">
                        <i class="bi bi-image"></i>
                        <span>Face 1</span>
                    </div>
                    <i  class="bi bi-x-square icon-x-square"></i>
                </div> 
                <div class="compare p-1 d-flex align-items-center">
                    <img class='w-100' src="../assets/equal.svg" alt="equal.svg">
                    <!-- <img class='w-100' src="../assets/equal-not.svg" alt="equal-not.svg"> -->
                </div> 
                <div class="face">
                    <div class="d-flex gap-2 face-title">
                        <i class="bi bi-image"></i>
                        <span>Face 2</span>
                    </div>
                    <i  class="bi bi-x-square icon-x-square"></i>
                </div> 
            </div>
        </div>
        <div class="col-12 col-md-8 col-lg-6 d-flex justify-content-center align-items-center">
            <div class="result correct">Similarity score : 0.99999999999</div>
        </div>
    </div>
  </div>
</template>

<script setup>

</script>

<style scoped>
.btn-compare-face{
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
.compare{
    height: 28px;
    width: 28px;
    border: 1px #dedede solid;
    border-radius: 4px;
}
.result{
    padding: 16px 48px;
}
.result.correct{
    background: rgb(246, 255, 237);
    border: 1px green solid;
    color: green;
}
.result.error{
    background: rgb(255, 241, 240);
    border: 1px red solid;
    color: red;
}
</style>