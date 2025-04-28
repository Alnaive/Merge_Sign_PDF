// Import styles
import './style.css';

// Import Vue and other necessary components
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import VuePdfEditor from '@libresign/vue-pdf-editor'; // Ensure correct path

const app = createApp(App);

// Register VuePdfEditor globally
app.component('VuePdfEditor', VuePdfEditor);

// Use the router
app.use(router);

// Mount the app
app.mount('#app');
