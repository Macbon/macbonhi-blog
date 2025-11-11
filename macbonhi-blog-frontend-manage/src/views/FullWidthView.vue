<template>
    <div class="full-width-view">
        <router-view />
    </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
    .full-width-view {
        padding: 0 32px 32px 32px; /* 四边都是32px，没有左侧的额外空间 */
    }
</style>