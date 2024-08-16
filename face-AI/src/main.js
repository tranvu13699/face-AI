import { createApp } from 'vue'
import './style.css'
import "./scss/custom.scss"
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-icons/font/bootstrap-icons.css'
import Toast, { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import App from './App.vue'
// import router from './router';

const options  = {
    // Các tùy chọn của toast đây
    position: "top-right",
    autoClose : 2000,
    className : 'toast'
};

createApp(App)
    .use(Toast, options)
    // .use(router)
    .provide('toast', toast)
    .mount('#app')
