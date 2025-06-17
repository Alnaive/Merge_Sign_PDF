import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PdfSignatureView from '@/views/PdfSignatureView.vue'
import SplitPdfView from '@/views/SplitPdfView.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/pdfSignature',
      name: 'pdfSignature',
      component: PdfSignatureView
    },
    {
      path: '/splitPdf',
      name: 'splitPdf',
      component: SplitPdfView
    }
  ]
})

export default router
