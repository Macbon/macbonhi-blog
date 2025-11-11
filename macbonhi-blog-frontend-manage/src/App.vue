<script setup lang="ts">
// import HelloWorld from './components/HelloWorld.vue'
import 'ant-design-vue';
import HeadBar from './components/HeadBar.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const showHeadBar = computed(() => {
  // 在登录和注册页面都不显示HeadBar
  return !['/login', '/register'].includes(route.path)
})
</script>

<template>
  

  <HeadBar v-if="showHeadBar" />

  <router-view />

</template>

<style scoped>

</style>


