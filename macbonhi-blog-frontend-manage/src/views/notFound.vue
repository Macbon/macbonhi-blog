<template>
    <div class="not-found-container">
        <div class="not-found-content">
            <h1 class="error-code">404</h1>
            <p class="error-message">哎呀！页面不见了</p>
            <p class="error-description">您访问的页面可能已被移除、更名或暂时不可用</p>
            <a-button type="primary" @click="backToHome" class="back-button">返回首页</a-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { isRegisterApi } from '../api/index'
import { useCode } from '../hooks/code'
import { message } from 'ant-design-vue'

const router = useRouter()
const { tackleCode } = useCode()

// 返回首页前验证登录状态
const backToHome = () => {
    // 验证登录状态
    isRegisterApi({}).then((res: any) => {
        if (tackleCode(res.code)) {
            // 已登录，返回首页
            router.push({ name: 'Overview' })
        } else {
            // 未登录或登录已过期，tackleCode会自动处理跳转到登录页面
            message.info('请先登录')
        }
    }).catch(() => {
        // 请求失败，默认跳转到登录页
        message.error('验证登录状态失败')
        router.push({ name: 'Login' })
    })
}
</script>

<style scoped>
.not-found-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: var(--background-color, #f5f5f5);
}

.not-found-content {
    text-align: center;
    padding: 40px;
    background-color: var(--background-topbar, #ffffff);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    max-width: 500px;
}

.error-code {
    font-size: 120px;
    font-weight: bold;
    color: var(--primary-color, #1890ff);
    margin: 0;
    line-height: 1.2;
}

.error-message {
    font-size: 24px;
    font-weight: 500;
    color: var(--text-color, #333);
    margin: 10px 0;
}

.error-description {
    font-size: 16px;
    color: var(--text-color-secondary, #666);
    margin-bottom: 30px;
}

.back-button {
    padding: 0 24px;
    height: 40px;
    font-size: 16px;
}
</style>
