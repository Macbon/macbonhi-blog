<template>
    <div class="index-view">
        <HeadBar />
        <router-view />
        
    </div>
    <Footer />
</template>

<script setup lang="ts">
import HeadBar from '../components/Views/HeadBar.vue'
import Footer from '../components/Views/Footer.vue'
</script>

<style scoped>
    .index-view{
        padding: 0px 136px 0px 136px;
    }
</style>