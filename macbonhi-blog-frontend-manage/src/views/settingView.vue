<template>
    <div class="settings-container">
        <div class="settings-header">
            <h1>系统设置</h1>
            <p>管理您的博客系统偏好设置</p>
        </div>

        <div class="settings-content">
            <a-row :gutter="24">
                <!-- 左侧设置面板 -->
                <a-col :span="16">
                    <a-card title="基本设置" class="settings-card">
                        <a-form layout="vertical">
                            <a-row :gutter="16">
                                <a-col :span="12">
                                    <a-form-item label="网站标题">
                                        <a-input v-model:value="settings.siteTitle" placeholder="请输入网站标题" />
                                    </a-form-item>
                                </a-col>
                                <a-col :span="12">
                                    <a-form-item label="网站描述">
                                        <a-input v-model:value="settings.siteDescription" placeholder="请输入网站描述" />
                                    </a-form-item>
                                </a-col>
                            </a-row>
                            
                            <a-row :gutter="16">
                                <a-col :span="12">
                                    <a-form-item label="主题模式">
                                        <a-select v-model:value="settings.theme" style="width: 100%">
                                            <a-select-option value="light">浅色模式</a-select-option>
                                            <a-select-option value="dark">深色模式</a-select-option>
                                            <a-select-option value="auto">跟随系统</a-select-option>
                                        </a-select>
                                    </a-form-item>
                                </a-col>
                                <a-col :span="12">
                                    <a-form-item label="语言设置">
                                        <a-select v-model:value="settings.language" style="width: 100%">
                                            <a-select-option value="zh-CN">简体中文</a-select-option>
                                            <a-select-option value="en-US">English</a-select-option>
                                        </a-select>
                                    </a-form-item>
                                </a-col>
                            </a-row>
                        </a-form>
                    </a-card>

                    <a-card title="内容设置" class="settings-card">
                        <a-form layout="vertical">
                            <a-row :gutter="16">
                                <a-col :span="12">
                                    <a-form-item label="文章每页显示数量">
                                        <a-input-number 
                                            v-model:value="settings.articlePageSize" 
                                            :min="5" 
                                            :max="50" 
                                            style="width: 100%" 
                                        />
                                    </a-form-item>
                                </a-col>
                                <a-col :span="12">
                                    <a-form-item label="图库每页显示数量">
                                        <a-input-number 
                                            v-model:value="settings.galleryPageSize" 
                                            :min="5" 
                                            :max="50" 
                                            style="width: 100%" 
                                        />
                                    </a-form-item>
                                </a-col>
                            </a-row>
                            
                            <a-form-item label="默认编辑器模式">
                                <a-radio-group v-model:value="settings.editorMode">
                                    <a-radio value="rich">富文本编辑器</a-radio>
                                    <a-radio value="markdown">Markdown编辑器</a-radio>
                                </a-radio-group>
                            </a-form-item>
                        </a-form>
                    </a-card>

                    <a-card title="数据管理" class="settings-card">
                        <a-space direction="vertical" style="width: 100%">
                            <div class="data-item">
                                <div class="data-info">
                                    <h4>清理缓存</h4>
                                    <p>清理系统缓存以释放存储空间</p>
                                </div>
                                <a-button type="primary" @click="clearCache">清理缓存</a-button>
                            </div>
                            
                            <a-divider />
                            
                            <div class="data-item">
                                <div class="data-info">
                                    <h4>导出数据</h4>
                                    <p>导出您的文章、图库等数据</p>
                                </div>
                                <a-button @click="exportData">导出数据</a-button>
                            </div>
                            
                            <a-divider />
                            
                            <div class="data-item">
                                <div class="data-info">
                                    <h4>重置设置</h4>
                                    <p>将所有设置恢复为默认值</p>
                                </div>
                                <a-button danger @click="resetSettings">重置设置</a-button>
                            </div>
                        </a-space>
                    </a-card>
                </a-col>

                <!-- 右侧信息面板 -->
                <a-col :span="8">
                    <a-card title="系统信息" class="settings-card">
                        <div class="system-info">
                            <div class="info-item">
                                <span class="label">版本号:</span>
                                <span class="value">v{{ version }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">构建时间:</span>
                                <span class="value">{{ buildTime }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">运行环境:</span>
                                <span class="value">{{ environment }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">浏览器:</span>
                                <span class="value">{{ browserInfo }}</span>
                            </div>
                        </div>
                    </a-card>

                    <a-card title="存储使用情况" class="settings-card">
                        <div class="storage-info">
                            <div class="storage-item">
                                <div class="storage-label">
                                    <span>文章数据</span>
                                    <span>{{ storageUsage.articles }}MB</span>
                                </div>
                                <a-progress :percent="storageUsage.articlesPercent" size="small" />
                            </div>
                            
                            <div class="storage-item">
                                <div class="storage-label">
                                    <span>图片文件</span>
                                    <span>{{ storageUsage.images }}MB</span>
                                </div>
                                <a-progress :percent="storageUsage.imagesPercent" size="small" />
                            </div>
                            
                            <div class="storage-item">
                                <div class="storage-label">
                                    <span>缓存数据</span>
                                    <span>{{ storageUsage.cache }}MB</span>
                                </div>
                                <a-progress :percent="storageUsage.cachePercent" size="small" />
                            </div>
                        </div>
                    </a-card>

                    <a-card title="快速操作" class="settings-card">
                        <a-space direction="vertical" style="width: 100%">
                            <a-button block type="primary" @click="goToProfile">
                                <UserOutlined />
                                个人资料
                            </a-button>
                            <a-button block @click="goToSecurity">
                                <LockOutlined />
                                账户安全
                            </a-button>
                            <a-button block @click="viewLogs">
                                <FileTextOutlined />
                                系统日志
                            </a-button>
                            <a-button block @click="syncSettings">
                                <ReloadOutlined />
                                同步设置
                            </a-button>
                            <a-button block @click="checkUpdates">
                                <ReloadOutlined />
                                检查更新
                            </a-button>
                        </a-space>
                    </a-card>
                </a-col>
            </a-row>
        </div>

        <!-- 个人资料编辑模态框 -->
        <a-modal
            v-model:open="profileModalVisible"
            title="个人资料编辑"
            width="600px"
            @ok="saveProfile"
            @cancel="cancelProfile"
        >
            <a-form :model="profileForm" layout="vertical">
                <a-row :gutter="16">
                    <a-col :span="24">
                        <div class="avatar-upload">
                            <a-upload
                                v-model:file-list="avatarFileList"
                                name="avatar"
                                list-type="picture-card"
                                class="avatar-uploader"
                                :show-upload-list="false"
                                :before-upload="beforeAvatarUpload"
                                @change="handleAvatarChange"
                            >
                                <img v-if="profileForm.avatar" :src="profileForm.avatar" alt="avatar" />
                                <div v-else>
                                    <div class="ant-upload-text">点击上传头像</div>
                                </div>
                            </a-upload>
                        </div>
                    </a-col>
                </a-row>
                
                <a-row :gutter="16">
                    <a-col :span="12">
                        <a-form-item label="用户名" name="username">
                            <a-input v-model:value="profileForm.username" placeholder="请输入用户名" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="昵称" name="nickname">
                            <a-input v-model:value="profileForm.nickname" placeholder="请输入昵称" />
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-row :gutter="16">
                    <a-col :span="12">
                        <a-form-item label="邮箱" name="email">
                            <a-input v-model:value="profileForm.email" placeholder="请输入邮箱" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="手机号" name="phone">
                            <a-input v-model:value="profileForm.phone" placeholder="请输入手机号" />
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-form-item label="个人简介" name="bio">
                    <a-textarea 
                        v-model:value="profileForm.bio" 
                        placeholder="请输入个人简介" 
                        :rows="4" 
                    />
                </a-form-item>

                <a-row :gutter="16">
                    <a-col :span="12">
                        <a-form-item label="个人网站" name="website">
                            <a-input v-model:value="profileForm.website" placeholder="https://" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="所在地" name="location">
                            <a-input v-model:value="profileForm.location" placeholder="请输入所在地" />
                        </a-form-item>
                    </a-col>
                </a-row>
            </a-form>
        </a-modal>

        <!-- 账户安全设置模态框 -->
        <a-modal
            v-model:open="securityModalVisible"
            title="账户安全设置"
            width="500px"
            :footer="null"
        >
            <a-tabs v-model:activeKey="securityTabKey" type="card">
                <a-tab-pane key="password" tab="修改密码">
                    <a-form :model="passwordForm" layout="vertical" @finish="changePassword">
                        <a-form-item label="当前密码" name="currentPassword" :rules="[{required: true, message: '请输入当前密码'}]">
                            <a-input-password v-model:value="passwordForm.currentPassword" placeholder="请输入当前密码" />
                        </a-form-item>
                        <a-form-item label="新密码" name="newPassword" :rules="[{required: true, min: 6, message: '密码至少6位'}]">
                            <a-input-password v-model:value="passwordForm.newPassword" placeholder="请输入新密码" />
                        </a-form-item>
                        <a-form-item label="确认新密码" name="confirmPassword" :rules="[
                            {required: true, message: '请确认新密码'},
                            {validator: validateConfirmPassword}
                        ]">
                            <a-input-password v-model:value="passwordForm.confirmPassword" placeholder="请再次输入新密码" />
                        </a-form-item>
                        <a-form-item>
                            <a-button type="primary" html-type="submit" block>修改密码</a-button>
                        </a-form-item>
                    </a-form>
                </a-tab-pane>

                <a-tab-pane key="2fa" tab="两步验证">
                    <div class="security-section">
                        <div class="security-item">
                            <div class="security-info">
                                <h4>两步验证</h4>
                                <p>为您的账户添加额外的安全保护</p>
                            </div>
                            <a-switch 
                                v-model:checked="securitySettings.twoFactorEnabled" 
                                @change="toggle2FA"
                            />
                        </div>
                        
                        <div v-if="securitySettings.twoFactorEnabled" class="security-setup">
                            <a-divider />
                            <p>请使用Google Authenticator或类似应用扫描二维码：</p>
                            <div class="qr-code-placeholder">
                                <div class="qr-mock">二维码占位符</div>
                            </div>
                            <a-input v-model:value="twoFactorCode" placeholder="请输入6位验证码" style="margin-top: 16px;" />
                            <a-button type="primary" @click="verify2FA" style="margin-top: 8px;" block>验证并启用</a-button>
                        </div>
                    </div>
                </a-tab-pane>

                <a-tab-pane key="sessions" tab="登录历史">
                    <div class="login-history">
                        <div v-for="session in loginSessions" :key="session.id" class="session-item">
                            <div class="session-info">
                                <div class="session-device">{{ session.device }}</div>
                                <div class="session-location">{{ session.location }} · {{ session.time }}</div>
                                <div class="session-ip">IP: {{ session.ip }}</div>
                            </div>
                            <div class="session-actions">
                                <a-tag v-if="session.current" color="green">当前会话</a-tag>
                                <a-button v-else size="small" danger @click="terminateSession(session.id)">终止</a-button>
                            </div>
                        </div>
                    </div>
                </a-tab-pane>
            </a-tabs>
        </a-modal>

        <!-- 底部操作按钮 -->
        <div class="settings-footer">
            <a-space>
                <a-button size="large" @click="resetForm">重置</a-button>
                <a-button type="primary" size="large" @click="saveSettings">保存设置</a-button>
            </a-space>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import { 
    UserOutlined, 
    LockOutlined, 
    FileTextOutlined, 
    ReloadOutlined 
} from '@ant-design/icons-vue'
import { useThemeStore } from '../store/theme'
import { useUserStore } from '../store/user'

// Store
const themeStore = useThemeStore()
const userStore = useUserStore()

// 设置数据
const settings = reactive({
    siteTitle: 'Macbonhi Blog',
    siteDescription: '一个优雅的个人博客系统',
    theme: themeStore.currentTheme || 'light',
    language: 'zh-CN',
    articlePageSize: 10,
    galleryPageSize: 12,
    editorMode: 'rich'
})

// 监听主题变化并同步到store
watch(() => settings.theme, (newTheme) => {
    themeStore.setTheme(newTheme)
})

// 系统信息
const version = ref('1.0.0')
const buildTime = ref(new Date().toLocaleString())
const environment = ref(import.meta.env.PROD ? '生产环境' : '开发环境')
const browserInfo = ref('')

// 存储使用情况
const storageUsage = reactive({
    articles: 25.6,
    articlesPercent: 30,
    images: 128.3,
    imagesPercent: 65,
    cache: 8.2,
    cachePercent: 15
})

// 个人资料模态框
const profileModalVisible = ref(false)
const avatarFileList = ref([])
const profileForm = reactive({
    username: '',
    nickname: '',
    email: '',
    phone: '',
    bio: '',
    website: '',
    location: '',
    avatar: ''
})

// 账户安全模态框
const securityModalVisible = ref(false)
const securityTabKey = ref('password')
const passwordForm = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
})

const securitySettings = reactive({
    twoFactorEnabled: false
})

const twoFactorCode = ref('')

// 登录历史数据
const loginSessions = reactive([
    {
        id: 1,
        device: 'Chrome on Windows',
        location: '北京市',
        time: '2024-01-15 14:30',
        ip: '192.168.1.100',
        current: true
    },
    {
        id: 2,
        device: 'Safari on iPhone',
        location: '上海市',
        time: '2024-01-14 09:15',
        ip: '192.168.1.101',
        current: false
    },
    {
        id: 3,
        device: 'Edge on Windows',
        location: '深圳市',
        time: '2024-01-13 16:45',
        ip: '192.168.1.102',
        current: false
    }
])

// 获取浏览器信息
const getBrowserInfo = () => {
    const ua = navigator.userAgent
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Safari')) return 'Safari'
    if (ua.includes('Edge')) return 'Edge'
    return '未知'
}

// 方法定义
const clearCache = () => {
    try {
        // 清理localStorage缓存
        const keysToKeep = ['theme', 'user-token', 'user-info'] // 保留重要数据
        const allKeys = Object.keys(localStorage)
        
        allKeys.forEach(key => {
            if (!keysToKeep.some(keepKey => key.includes(keepKey))) {
                localStorage.removeItem(key)
            }
        })
        
        // 清理sessionStorage
        sessionStorage.clear()
        
        // 强制垃圾回收（如果浏览器支持）
        if (window.gc) {
            window.gc()
        }
        
        message.success('缓存清理成功！')
    } catch (error) {
        console.error('清理缓存失败:', error)
        message.error('缓存清理失败')
    }
}

const exportData = () => {
    try {
        // 收集当前设置数据
        const exportSettings = {
            ...settings,
            exportTime: new Date().toISOString(),
            version: '1.0.0'
        }
        
        // 创建下载链接
        const dataStr = JSON.stringify(exportSettings, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        
        // 创建下载链接
        const link = document.createElement('a')
        link.href = url
        link.download = `blog-settings-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // 清理URL对象
        URL.revokeObjectURL(url)
        
        message.success('设置数据导出成功！')
    } catch (error) {
        console.error('导出数据失败:', error)
        message.error('数据导出失败')
    }
}

const resetSettings = () => {
    // 确认对话框
    const confirmed = confirm('确定要重置所有设置吗？此操作不可撤销。')
    
    if (confirmed) {
        try {
            // 重置设置数据
            Object.assign(settings, {
                siteTitle: 'Macbonhi Blog',
                siteDescription: '一个优雅的个人博客系统',
                theme: 'light',
                language: 'zh-CN',
                articlePageSize: 10,
                galleryPageSize: 12,
                editorMode: 'rich'
            })
            
            // 重置主题store
            themeStore.setTheme('light')
            
            // 清理相关缓存
            localStorage.removeItem('blog-settings')
            
            message.success('设置已重置为默认值')
        } catch (error) {
            console.error('重置设置失败:', error)
            message.error('重置设置失败')
        }
    }
}

const goToProfile = () => {
    // 从用户store加载当前用户信息
    Object.assign(profileForm, {
        username: userStore.name || '',
        nickname: userStore.name || '',
        email: '',
        phone: '',
        bio: '',
        website: '',
        location: '',
        avatar: ''
    })
    profileModalVisible.value = true
}

const goToSecurity = () => {
    securityModalVisible.value = true
    securityTabKey.value = 'password'
}

// 个人资料相关方法
const beforeAvatarUpload = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
    if (!isJpgOrPng) {
        message.error('只能上传 JPG/PNG 格式的图片!')
        return false
    }
    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isLt2M) {
        message.error('图片大小不能超过 2MB!')
        return false
    }
    return false // 阻止自动上传，手动处理
}

const handleAvatarChange = (info) => {
    if (info.file) {
        // 创建图片预览
        const reader = new FileReader()
        reader.onload = (e) => {
            if (e.target && typeof e.target.result === 'string') {
                profileForm.avatar = e.target.result
            }
        }
        reader.readAsDataURL(info.file)
    }
}

const saveProfile = async () => {
    try {
        // 更新用户store
        userStore.updateUserInfo({
            name: profileForm.nickname || profileForm.username
        })
        
        // 这里可以调用API保存到后端
        // await updateUserProfileApi(profileForm)
        
        profileModalVisible.value = false
        message.success('个人资料更新成功！')
    } catch (error) {
        console.error('更新个人资料失败:', error)
        message.error('更新失败，请重试')
    }
}

const cancelProfile = () => {
    profileModalVisible.value = false
    // 重置表单
    Object.assign(profileForm, {
        username: '',
        nickname: '',
        email: '',
        phone: '',
        bio: '',
        website: '',
        location: '',
        avatar: ''
    })
}

// 账户安全相关方法
const validateConfirmPassword = (rule, value) => {
    if (value && value !== passwordForm.newPassword) {
        return Promise.reject(new Error('两次输入的密码不一致'))
    }
    return Promise.resolve()
}

const changePassword = async () => {
    try {
        // 这里调用API修改密码
        // await changePasswordApi(passwordForm)
        
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 重置表单
        Object.assign(passwordForm, {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        })
        
        message.success('密码修改成功！')
    } catch (error) {
        console.error('修改密码失败:', error)
        message.error('密码修改失败，请检查当前密码是否正确')
    }
}

const toggle2FA = (enabled) => {
    if (enabled) {
        message.info('请扫描二维码并输入验证码以启用两步验证')
    } else {
        securitySettings.twoFactorEnabled = false
        message.success('两步验证已关闭')
    }
}

const verify2FA = () => {
    if (!twoFactorCode.value || twoFactorCode.value.length !== 6) {
        message.error('请输入6位验证码')
        return
    }
    
    // 这里验证验证码
    // 模拟验证过程
    if (twoFactorCode.value === '123456') {
        message.success('两步验证启用成功！')
        twoFactorCode.value = ''
    } else {
        message.error('验证码错误，请重试')
    }
}

const terminateSession = (sessionId) => {
    const index = loginSessions.findIndex(session => session.id === sessionId)
    if (index !== -1) {
        loginSessions.splice(index, 1)
        message.success('会话已终止')
    }
}

const viewLogs = () => {
    // 创建一个简单的日志查看器
    const logs = [
        `[${new Date().toLocaleString()}] 系统启动成功`,
        `[${new Date(Date.now() - 300000).toLocaleString()}] 用户登录: ${userStore.name || 'admin'}`,
        `[${new Date(Date.now() - 600000).toLocaleString()}] 文章发布成功`,
        `[${new Date(Date.now() - 900000).toLocaleString()}] 主题切换: ${settings.theme}`,
        `[${new Date(Date.now() - 1200000).toLocaleString()}] 缓存清理完成`
    ]
    
    // 创建临时日志文件并下载
    const logContent = logs.join('\n')
    const blob = new Blob([logContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `system-logs-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
    message.success('系统日志已导出')
}

const checkUpdates = () => {
    // 模拟检查更新过程
    const loading = message.loading('正在检查更新...', 0)
    
    setTimeout(() => {
        loading()
        const isUpdateAvailable = Math.random() > 0.7 // 30%概率有更新
        
        if (isUpdateAvailable) {
            message.success('发现新版本 v1.0.1，请前往官网下载最新版本')
        } else {
            message.info('当前已是最新版本')
        }
    }, 2000)
}

const resetForm = () => {
    Object.assign(settings, {
        siteTitle: 'Macbonhi Blog',
        siteDescription: '一个优雅的个人博客系统',
        theme: 'light',
        language: 'zh-CN',
        articlePageSize: 10,
        galleryPageSize: 12,
        editorMode: 'rich'
    })
    message.success('表单已重置')
}

const saveSettings = async () => {
    const loading = message.loading('正在保存设置...', 0)
    
    try {
        // 保存到localStorage
        localStorage.setItem('blog-settings', JSON.stringify(settings))
        
        // 应用主题设置
        themeStore.setTheme(settings.theme)
        
        // 调用API保存到后端
        await saveSettingsToServer(settings)
        
        loading()
        message.success('设置保存成功！')
    } catch (error) {
        loading()
        console.error('保存设置失败:', error)
        message.error('设置保存失败')
    }
}

// 后端API集成功能
const saveSettingsToServer = async (settingsData) => {
    try {
        // 这里实现实际的API调用
        // const response = await fetch('/api/admin/settings', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': `Bearer ${userStore.token}`
        //     },
        //     body: JSON.stringify(settingsData)
        // })
        
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // 模拟网络错误（10%概率）
        if (Math.random() < 0.1) {
            throw new Error('网络连接失败')
        }
        
        console.log('设置已同步到服务器:', settingsData)
        return { success: true }
        
    } catch (error) {
        console.error('服务器同步失败:', error)
        throw error
    }
}

const loadSettingsFromServer = async () => {
    try {
        // 这里实现从服务器加载设置
        // const response = await fetch('/api/admin/settings', {
        //     headers: {
        //         'Authorization': `Bearer ${userStore.token}`
        //     }
        // })
        // const serverSettings = await response.json()
        
        // 模拟从服务器加载设置
        const serverSettings = {
            siteTitle: 'Macbonhi Blog',
            siteDescription: '一个优雅的个人博客系统',
            theme: 'light',
            language: 'zh-CN',
            articlePageSize: 15,
            galleryPageSize: 18,
            editorMode: 'rich',
            syncTime: new Date().toISOString()
        }
        
        // 合并服务器设置和本地设置
        Object.assign(settings, serverSettings)
        
        console.log('从服务器加载设置:', serverSettings)
        return serverSettings
        
    } catch (error) {
        console.error('从服务器加载设置失败:', error)
        // 如果服务器加载失败，使用本地设置
        return null
    }
}

const syncSettings = async () => {
    const loading = message.loading('正在同步设置...', 0)
    
    try {
        // 从服务器获取最新设置
        const serverSettings = await loadSettingsFromServer()
        
        if (serverSettings) {
            // 比较时间戳，使用最新的设置
            const localSettings = localStorage.getItem('blog-settings')
            if (localSettings) {
                const local = JSON.parse(localSettings)
                const serverTime = new Date(serverSettings.syncTime || 0)
                const localTime = new Date(local.syncTime || 0)
                
                if (serverTime > localTime) {
                    Object.assign(settings, serverSettings)
                    localStorage.setItem('blog-settings', JSON.stringify(serverSettings))
                    message.success('设置已从服务器同步')
                } else {
                    // 本地设置更新，上传到服务器
                    await saveSettingsToServer(settings)
                    message.success('本地设置已同步到服务器')
                }
            }
        }
        
        loading()
    } catch (error) {
        loading()
        console.error('设置同步失败:', error)
        message.error('设置同步失败，将使用本地设置')
    }
}

// 加载本地保存的设置
const loadSavedSettings = () => {
    try {
        const savedSettings = localStorage.getItem('blog-settings')
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings)
            Object.assign(settings, parsed)
        }
    } catch (error) {
        console.error('加载设置失败:', error)
    }
}

// 获取实时存储使用情况
const updateStorageUsage = () => {
    try {
        // 计算localStorage使用量
        let localStorageSize = 0
        for (const key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                localStorageSize += localStorage[key].length
            }
        }
        
        storageUsage.cache = Number((localStorageSize / 1024 / 1024).toFixed(2))
        storageUsage.cachePercent = Math.min(Math.round((localStorageSize / (5 * 1024 * 1024)) * 100), 100)
        
    } catch (error) {
        console.error('计算存储使用量失败:', error)
    }
}

// 组件挂载时初始化
onMounted(async () => {
    browserInfo.value = getBrowserInfo()
    
    // 首先尝试从服务器加载设置
    try {
        const serverSettings = await loadSettingsFromServer()
        if (serverSettings) {
            Object.assign(settings, serverSettings)
        } else {
            // 服务器加载失败，使用本地设置
            loadSavedSettings()
        }
    } catch (error) {
        // 服务器不可用，使用本地设置
        loadSavedSettings()
    }
    
    updateStorageUsage()
    
    // 同步当前主题到设置
    settings.theme = themeStore.currentTheme || settings.theme || 'light'
})
</script>

<style scoped>
.settings-container {
    padding: 24px;
    background-color: var(--background-color);
    min-height: calc(100vh - 64px);
}

.settings-header {
    margin-bottom: 24px;
}

.settings-header h1 {
    margin: 0 0 8px 0;
    color: var(--text-color);
    font-size: 28px;
    font-weight: 600;
}

.settings-header p {
    margin: 0;
    color: var(--gray-500);
    font-size: 14px;
}

.settings-content {
    margin-bottom: 24px;
}

.settings-card {
    margin-bottom: 24px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.data-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.data-info h4 {
    margin: 0 0 4px 0;
    color: var(--text-color);
    font-size: 16px;
    font-weight: 500;
}

.data-info p {
    margin: 0;
    color: var(--gray-500);
    font-size: 14px;
}

.system-info .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--gray-200);
}

.system-info .info-item:last-child {
    border-bottom: none;
}

.info-item .label {
    color: var(--gray-600);
    font-size: 14px;
}

.info-item .value {
    color: var(--text-color);
    font-size: 14px;
    font-weight: 500;
}

.storage-info .storage-item {
    margin-bottom: 16px;
}

.storage-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.storage-label span:first-child {
    color: var(--text-color);
    font-size: 14px;
}

.storage-label span:last-child {
    color: var(--gray-500);
    font-size: 12px;
}

.settings-footer {
    text-align: center;
    padding: 24px 0;
    border-top: 1px solid var(--gray-200);
}

/* 深色模式适配 */
[data-theme="dark"] .settings-card {
    background-color: var(--gray-100);
    border-color: var(--gray-300);
}

[data-theme="dark"] .system-info .info-item {
    border-color: var(--gray-300);
}

[data-theme="dark"] .settings-footer {
    border-color: var(--gray-300);
}

/* 个人资料模态框样式 */
.avatar-upload {
    text-align: center;
    margin-bottom: 24px;
}

.avatar-uploader .ant-upload {
    width: 120px !important;
    height: 120px !important;
    border-radius: 50%;
}

.avatar-uploader .ant-upload img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
}

.avatar-uploader .ant-upload-text {
    margin-top: 40px;
    color: var(--gray-500);
    font-size: 12px;
}

/* 账户安全样式 */
.security-section {
    padding: 16px 0;
}

.security-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
}

.security-info h4 {
    margin: 0 0 4px 0;
    color: var(--text-color);
    font-size: 16px;
    font-weight: 500;
}

.security-info p {
    margin: 0;
    color: var(--gray-500);
    font-size: 14px;
}

.security-setup {
    padding: 16px 0;
}

.qr-code-placeholder {
    text-align: center;
    padding: 40px;
    border: 2px dashed var(--gray-300);
    border-radius: 8px;
    margin: 16px 0;
}

.qr-mock {
    width: 120px;
    height: 120px;
    background: var(--gray-100);
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--gray-500);
    font-size: 12px;
    border-radius: 4px;
}

/* 登录历史样式 */
.login-history {
    max-height: 300px;
    overflow-y: auto;
}

.session-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid var(--gray-200);
}

.session-item:last-child {
    border-bottom: none;
}

.session-info {
    flex: 1;
}

.session-device {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-color);
    margin-bottom: 4px;
}

.session-location {
    font-size: 12px;
    color: var(--gray-500);
    margin-bottom: 2px;
}

.session-ip {
    font-size: 12px;
    color: var(--gray-400);
}

.session-actions {
    margin-left: 16px;
}

/* 深色模式适配 */
[data-theme="dark"] .avatar-uploader .ant-upload-text {
    color: var(--gray-400);
}

[data-theme="dark"] .qr-code-placeholder {
    border-color: var(--gray-400);
}

[data-theme="dark"] .qr-mock {
    background: var(--gray-200);
    color: var(--gray-600);
}

[data-theme="dark"] .session-item {
    border-color: var(--gray-300);
}
</style>
