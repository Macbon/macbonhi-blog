<template>
    <div class="login-container">
        <div class="login-box">
            <div class="login-box-l">
                <div class="login-image-container">
                    <img src="../assets/Group 11.png" alt="loginpic" class="loginpic">
                </div>
            </div>

            <div class="login-box-r">
                <div class="login-box-r-top">
                    <img src="../assets/avatar.png" alt="logo" class="logo"/>
                    <p class="login-title">{{ isRegister ? '博客平台注册' : '博客平台登录' }}</p>
                </div>
                <div class="login-box-r-center">
                    <a-input 
                        v-model:value="accountvalue" 
                        placeholder="请输入账号"
                        :style="{ width: inputWidth + 'px' }"
                    />
                    <a-input 
                        v-model:value.lazy="passwordvalue" 
                        type="password"
                        placeholder="请输入密码"
                        :style="{ width: inputWidth + 'px' }"
                    />
                    <template v-if="isRegister">
                        <a-input 
                            v-model:value="phonevalue" 
                            placeholder="请输入手机号"
                            :style="{ width: inputWidth + 'px' }"
                        />
                        <div class="verify-code-container" :style="{ width: inputWidth + 'px' }">
                            <a-input 
                                v-model:value="verifycode" 
                                placeholder="请输入验证码"
                                :style="{ width: '60%' }"
                            />
                            <a-button type="primary" :style="{ width: '35%' }">获取验证码</a-button>
                        </div>
                    </template>
                </div>
                <div class="login-box-r-bottom">
                    <template v-if="isRegister">
                        <a-button 
                            @click="backToLogin"
                            :style="{ width: buttonWidth + 'px' }"
                        >返回登录</a-button>
                        <a-button 
                            type="primary"
                            @click="register"
                            :style="{ width: buttonWidth + 'px' }"
                        >确认注册</a-button>
                    </template>
                    <template v-else>
                        <a-button 
                            @click="toregister"
                            :style="{ width: buttonWidth + 'px' }"
                        >注册</a-button>
                        <a-button 
                            type="primary"
                            @click="login"
                            :style="{ width: buttonWidth + 'px' }"
                        >登录</a-button>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { registerApi, loginApi } from '../api/index'
import { useCode } from '../hooks/code'
import { message } from 'ant-design-vue'
import { useUserStore } from '../store/user'

//code验证
const { tackleCode } = useCode();

const router = useRouter()
const route = useRoute()
//pinia存储token
const userStore = useUserStore()

const accountvalue = ref<string>('');
const passwordvalue = ref<string>('')
const phonevalue = ref<string>('')
const verifycode = ref<string>('')
const isRegister = ref(route.path === '/register')

// 获取窗口高度
const windowHeight = ref(window.innerHeight)
const windowWidth = ref(window.innerWidth)
// 计算登录框的尺寸
const boxWidth = ref(Math.min(windowWidth.value * 0.8, 1000)) // 最大宽度1000px
const boxHeight = ref(Math.min(windowHeight.value * 0.8, 700)) // 最大高度700px
// 计算响应式尺寸
const logoSize = computed(() => Math.min(windowWidth.value * 0.08, 80)) //根据窗口宽度计算 logo 大小
const titleSize = computed(() => Math.min(windowWidth.value * 0.03, 24)) //根据窗口宽度计算标题大小
const inputWidth = computed(() => Math.min(windowWidth.value * 0.2, 300)) //根据窗口宽度计算输入框宽度  
const buttonWidth = computed(() => Math.min(windowWidth.value * 0.1, 120)) //根据窗口宽度计算按钮宽度   
const spacing = computed(() => Math.min(windowWidth.value * 0.1, 24)) //根据窗口宽度计算间距
const leftImageWidth = computed(() => Math.min(windowWidth.value * 0.3, 400)) // 左侧图片宽度
const leftImageHeight = computed(() => Math.min(windowHeight.value * 0.6, 500)) // 左侧图片高度

// 监听窗口大小变化
const handleResize = () => {
    windowHeight.value = window.innerHeight
    windowWidth.value = window.innerWidth
    boxWidth.value = Math.min(windowWidth.value * 0.8, 1000)
    boxHeight.value = Math.min(windowHeight.value * 0.8, 700)
}

const toregister = () => {
    isRegister.value = true
    router.push({ name: 'Register' })
}

//提交注册
const register = () => {

    //这里缺少我们的手机号验证，这里接码平台我们后续再完善
    let data = {
        name: accountvalue.value,
        password: passwordvalue.value,
        phone: phonevalue.value,
        moment: new Date()
    }
    
    // 验证账号不能包含空格且长度必须大于4位
    if (accountvalue.value.includes(' ')) {
        message.error('账号不能包含空格')
        return
    }
    
    // 验证密码不能包含空格且长度必须大于8位
    if (passwordvalue.value.includes(' ')) {
        message.error('密码不能包含空格')
        return
    }
    
    if (accountvalue.value.length < 4) {
        message.error('账号长度必须大于4位')
        return
    }
    
    if (passwordvalue.value.length < 8) {
        message.error('密码长度必须大于8位')
        return
    }
    
    if (phonevalue.value.length !== 11) {
        message.error('手机号必须为11位')
        return
    }

    if(accountvalue.value && passwordvalue.value && phonevalue.value && verifycode.value) {
        registerApi(data).then((res:any) => {
            if (tackleCode(res.code)) {
                //注册成功
                router.push({ name: 'Login' })
                message.success('注册成功')
            } else {
                message.error('输入不完善')
            }
        })
    }
}

//提交登录
const login = () => {
    // 执行登录逻辑
    if(accountvalue.value && passwordvalue.value) {
        let data = {
            name: accountvalue.value,
            password: passwordvalue.value
        }
        
        loginApi(data).then((res:any) => {
            if (res.code === 200) {
                // 使用$patch更新store状态
                userStore.$patch({
                  id: res.data.id,
                  name: res.data.name,
                  token: res.data.token
                })
                // 登录成功，跳转到首页
                router.push({ name: 'Overview' })
                message.success('登录成功')
            } else if(res.code === 400){
                message.error('用户账号或密码错误')
            }
        }).catch(error => {
            message.error('登录请求失败，请稍后重试')
            console.error('登录错误:', error)
        })
    } else {
        message.error('请输入账号和密码')
    }
}

const backToLogin = () => {
    isRegister.value = false
    router.push({ name: 'Login' })
}

// 监听路由变化
watch(() => route.path, (newPath) => {
    isRegister.value = newPath === '/register'
})

onMounted(() => {
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.login-container {
    height: 100vh;
    width: 100vw;
    background-color: var(--background-color);
    display: flex;
    justify-content: center;
    align-items: center;
}

.login-box {
    width: v-bind(boxWidth + 'px');
    height: v-bind(boxHeight + 'px');
    background-color: var(--background-topbar);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    padding: v-bind(spacing * 2 + 'px');
    box-sizing: border-box;
    justify-content: space-between;
    gap: v-bind(spacing * 2 + 'px');
}

.login-box-l {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    min-width: 0; /* 防止flex子项溢出 */
}

.login-image-container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
}

.loginpic {
    width: v-bind(leftImageWidth + 'px');
    height: v-bind(leftImageHeight + 'px');
    object-fit: contain;
    transition: all 0.3s ease;
}

.login-box-r {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-width: 0; /* 防止flex子项溢出 */
}

.login-box-r-top {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-bottom: v-bind(spacing * 2 + 'px');
}

.login-box-r-center {
    display: flex;
    flex-direction: column;
    gap: v-bind(spacing + 'px');
    align-items: center;
    margin-bottom: v-bind(spacing + 'px');
    width: 100%;
}

.verify-code-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: v-bind(spacing + 'px');
}

.login-box-r-bottom {
    display: flex;
    gap: v-bind(spacing * 2 + 'px');
    align-items: center;
}

.logo {
    height: v-bind(logoSize + 'px');
    width: v-bind(logoSize + 'px');
    border-radius: 50%;
    object-fit: cover;
}

.login-title {
    font-size: v-bind(titleSize + 'px');
    font-weight: 600;
    color: var(--text-color);
    margin-top: v-bind(spacing + 'px');
}

/* 响应式布局调整 */
@media screen and (max-width: 768px) {
    .login-box {
        flex-direction: column;
        padding: v-bind(spacing + 'px');
        height: auto;
        min-height: v-bind(boxHeight + 'px');
    }
    
    .login-box-l {
        display: none;
    }

    .login-box-r {
        width: 100%;
    }
}

</style>