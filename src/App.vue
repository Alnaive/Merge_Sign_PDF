<script setup>
import { RouterLink, RouterView } from 'vue-router'
import Navbar from './components/Navbar.vue'
</script>

<template>
  <header>
    <Navbar/>
    <div class="wrapper">
      <template>
  <h1 class="text-3xl font-bold underline">
    Hello world!
  </h1>
</template>
     
    </div>
  </header>

  <RouterView />
</template>
