<template>
  <header class="text-gray-400 bg-gray-900 body-font">
    <div class="container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center">
      <nav class="md:ml-auto flex flex-wrap items-center text-base justify-center">
        <!-- <router-link to="/" class="mr-5 hover:text-white">Home</router-link> -->
        <router-link to="/" class="mr-5 hover:text-white">Merge PDF</router-link>
        <router-link to="/splitPdf" class="mr-5 hover:text-white">Split PDF</router-link>
        <router-link to="/pdfSignature" class="mr-5 hover:text-white">PDF Signature</router-link>
      </nav>
      <!-- <button class="inline-flex items-center bg-gray-800 border-0 py-1 px-3 focus:outline-none hover:bg-gray-700 rounded text-base mt-4 md:mt-0">Button
            <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="w-4 h-4 ml-1" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7"></path>
            </svg>
        </button> -->
    </div>
  </header>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>
