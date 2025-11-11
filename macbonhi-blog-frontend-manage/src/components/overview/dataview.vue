<template>
    <div size="large" style="height: 900px; display: flex; flex-direction: column; gap: 24px;">
        <div class="data-card">
            <div class="data-card-title">
                <span class="data-card-title-text">
                    数据视图
                </span>
                <a-radio-group v-model:value="value1" button-style="solid" @change="handleRadioChange">
                    <a-radio-button value="week">
                        近一周
                    </a-radio-button>
                    <a-radio-button value="month">
                        近一个月
                    </a-radio-button>
                </a-radio-group>
            </div>
            <div style="flex: 1;">
                <line1 v-if="!visitLoading" :data="visitData" chartHeight="310px"></line1>
                <a-spin v-else tip="加载中..." style="margin-top: 100px;"></a-spin>
            </div>
        </div>
        
        <div class="data-card">
            <div class="data-card-title">
                <span class="data-card-title-text">
                    数据检测    
                </span>
                <a-radio-group v-model:value="value2" button-style="solid" @change="handleRadioChange2">
                    <a-radio-button value="week">
                        近一周
                    </a-radio-button>
                    <a-radio-button value="month">
                        近一个月
                    </a-radio-button>
                </a-radio-group>
            </div>

            <div style="display: flex; gap: 24px;">
                <div style="flex: 1;">
                    <pie 
                        v-if="!deviceLoading" 
                        :data="processDeviceData" 
                        title="设备总数" 
                        chartHeight="310px"
                    ></pie>
                    <a-spin v-else tip="加载中..." style="margin-top: 100px;"></a-spin>
                </div>
                <div style="flex: 1;">
                    <pie 
                        v-if="!contentLoading" 
                        :data="processWebsiteData" 
                        title="网站内容分布" 
                        chartHeight="310px"
                    ></pie>
                    <a-spin v-else tip="加载中..." style="margin-top: 100px;"></a-spin>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import line1 from '../echarts/line1.vue';
import pie from '../echarts/pie.vue';
import { getVisitTrendsApi, getDeviceAnalysisApi, getContentDistributionApi } from '../../api';
import { message } from 'ant-design-vue';

// 状态变量
const token = localStorage.getItem('token');
const visitData = ref<any[]>([]);
const processDeviceData = ref<any[]>([]);
const processWebsiteData = ref<any[]>([]);
const value1 = ref<string>('week');
const value2 = ref<string>('week');

// 加载状态
const visitLoading = ref(false);
const deviceLoading = ref(false);
const contentLoading = ref(false);

// 日期格式化工具函数
const formatDate = (dateStr: string): string => {
    try {
        // 处理不同格式的日期字符串
        let date: Date;
        
        // 如果是 YYYY-MM-DD 格式，直接解析
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const [year, month, day] = dateStr.split('-');
            return `${parseInt(month)}-${parseInt(day)}`;
        }
        
        // 如果是ISO格式字符串 (如: 2025-06-15T16:00:00.000Z)
        if (dateStr.includes('T') || dateStr.includes('Z')) {
            date = new Date(dateStr);
            // 使用UTC方法避免时区问题
            const month = date.getUTCMonth() + 1;
            const day = date.getUTCDate();
            return `${month}-${day}`;
        }
        
        // 尝试直接解析
        date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            console.warn('无效的日期格式:', dateStr);
            return dateStr;
        }
        
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}-${day}`;
    } catch (error) {
        console.error('日期格式化错误:', error, '原始日期:', dateStr);
        return dateStr;
    }
};

// 生成完整日期序列的工具函数（用于补全缺失日期）
const generateDateRange = (period: string): string[] => {
    const dates: string[] = [];
    const now = new Date();
    const days = period === 'week' ? 7 : 30;
    
    // 从今天开始往前推算
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        const month = date.getMonth() + 1;
        const day = date.getDate();
        dates.push(`${month}-${day}`);
    }
    
    return dates;
};

// 处理访问量数据，补全缺失的日期
const processVisitData = (apiDates: string[], apiVisits: number[], period: string) => {
    
    // 生成期望的完整日期序列
    const expectedDates = generateDateRange(period);
    
    // 将API返回的数据转换为Map，方便查找
    const apiDataMap = new Map<string, number>();
    
    apiDates.forEach((dateStr, index) => {
        const formattedDate = formatDate(dateStr);
        const visitCount = apiVisits[index] || 0;
        apiDataMap.set(formattedDate, visitCount);
    });
    
    // 生成完整的数据，为缺失的日期设置访问量为0
    const completeData = expectedDates.map(date => {
        const value = apiDataMap.get(date) || 0;
        return {
            date,
            value
        };
    });
    
    return completeData;
};

// 获取访问量趋势数据
const getVisitData = async (period: string) => {
    visitLoading.value = true;
    
    try {
        const response = await getVisitTrendsApi({ token, period });

        console.log(response);
        if (response.code === 200 && response.data) {
            const { dates, visits, statistics } = response.data;
                  
            // 验证数据完整性
            if (!Array.isArray(dates) || !Array.isArray(visits)) {
                throw new Error('API返回的数据格式不正确：dates或visits不是数组');
            }
            
            if (dates.length !== visits.length) {
                console.warn('日期和访问量数组长度不匹配:', { 
                    datesLength: dates.length, 
                    visitsLength: visits.length 
                });
            }
            
            // 处理数据，补全缺失的日期
            visitData.value = processVisitData(dates, visits, period);
            
            
        } else {
            const errorMsg = response.message || `API返回错误状态码: ${response.code}`;
            console.error('API返回错误:', errorMsg);
            message.error(`获取访问趋势数据失败: ${errorMsg}`);
            await setMockVisitData(period);
        }
    } catch (error) {
        console.error('获取访问趋势数据错误:', error);
        message.error('获取访问趋势数据出错，已切换到模拟数据');
        await setMockVisitData(period);
    } finally {
        visitLoading.value = false;
    }
};

// 设置模拟访问数据（当API失败时使用）- 仅开发环境
const setMockVisitData = async (period: string) => {
    if (!import.meta.env.DEV) {
        console.warn('生产环境无法使用模拟数据');
        visitData.value = [];
        return;
    }
    
    try {
        // 动态导入mock数据
        const { mockVisitData } = await import('../../mock/data');
        const dataCount = period === 'week' ? 7 : 30;
        
        // 确保模拟数据有足够的长度
        if (mockVisitData.data.length >= dataCount) {
            visitData.value = mockVisitData.data.slice(0, dataCount);
        } else {
            // 如果模拟数据不够，生成补充数据
            const mockData = [...mockVisitData.data];
            while (mockData.length < dataCount) {
                const lastDate = mockData[mockData.length - 1]?.date || '6-21';
                const [month, day] = lastDate.split('-').map((n: string) => parseInt(n));
                const nextDay = day + 1;
                mockData.push({
                    date: `${month}-${nextDay}`,
                    value: Math.floor(Math.random() * 20) + 1
                });
            }
            visitData.value = mockData.slice(0, dataCount);
        }
        
        console.log('设置的模拟数据:', visitData.value);
    } catch (error) {
        console.error('导入mock数据失败:', error);
        visitData.value = [];
    }
};

// 获取设备和内容分布数据
const getDistributionData = async (period: string) => {

    console.log(`开始获取${period}的分布数据`);
    deviceLoading.value = true;
    contentLoading.value = true;
    
    // 获取设备分析数据
    try {
        const deviceResponse = await getDeviceAnalysisApi({ token, period });
        console.log('设备分析API返回数据:', deviceResponse);
        // 添加设备数据详细打印
        console.log('【原始设备数据】:', JSON.stringify(deviceResponse.data, null, 2));
        
        if (deviceResponse.code === 200 && deviceResponse.data) {
            // 验证设备数据结构
            if (deviceResponse.data.device_types && Array.isArray(deviceResponse.data.device_types)) {
                processDeviceData.value = deviceResponse.data.device_types.map((item: any) => ({
                    key: item.name || item.key || 'unknown',
                    name: item.name || item.key || 'unknown',
                    value: Number(item.value) || 0
                }));
                console.log('处理后的设备数据:', processDeviceData.value);
            } else {
                console.warn('设备类型数据格式不正确:', deviceResponse.data);
                await setMockDeviceData(period);
            }
        } else {
            const errorMsg = deviceResponse.message || '获取设备分布数据失败';
            console.error('设备API错误:', errorMsg);
            message.error(errorMsg);
            await setMockDeviceData(period);
        }
    } catch (error) {
        console.error('获取设备分布数据错误:', error);
        message.error('获取设备分布数据出错');
        await setMockDeviceData(period);
    } finally {
        deviceLoading.value = false;
    }
    
    // 获取内容分布数据
    try {
        const contentResponse = await getContentDistributionApi({ token, period });
        console.log('内容分布API返回数据:', contentResponse);
        // 添加内容数据详细打印
        console.log('【原始内容数据】:', JSON.stringify(contentResponse.data, null, 2));
        
        if (contentResponse.code === 200 && contentResponse.data) {
            // 验证内容数据结构
            if (contentResponse.data.total_distribution && Array.isArray(contentResponse.data.total_distribution)) {
                processWebsiteData.value = contentResponse.data.total_distribution.map((item: any) => ({
                    key: item.name || item.key || 'unknown',
                    name: item.name || item.key || 'unknown',
                    value: Number(item.value) || 0
                }));
                console.log('处理后的内容数据:', processWebsiteData.value);
            } else {
                console.warn('内容分布数据格式不正确:', contentResponse.data);
                await setMockWebsiteData(period);
            }
        } else {
            const errorMsg = contentResponse.message || '获取内容分布数据失败';
            console.error('内容API错误:', errorMsg);
            message.error(errorMsg);
            await setMockWebsiteData(period);
        }
    } catch (error) {
        console.error('获取内容分布数据错误:', error);
        message.error('获取内容分布数据出错');
        await setMockWebsiteData(period);
    } finally {
        contentLoading.value = false;
    }
};

// 设置模拟设备数据（当API失败时使用）- 仅开发环境
const setMockDeviceData = async (period: string) => {
    if (!import.meta.env.DEV) {
        console.warn('生产环境无法使用模拟数据');
        processDeviceData.value = [];
        return;
    }
    
    console.log('使用模拟设备数据, period:', period);
    
    try {
        const { mockPieData } = await import('../../mock/data');
        const dataCount = period === 'week' ? 7 : 30;
        const recentData = mockPieData.data.slice(0, dataCount);
        const deviceTotals: Record<string, { key: string, name: string, value: number }> = {};
        
        recentData.forEach((item: any) => {
            if (item.device && Array.isArray(item.device)) {
                item.device.forEach((deviceitem: any) => {
                    const key = deviceitem.key || deviceitem.name || 'unknown';
                    if (!deviceTotals[key]) {
                        deviceTotals[key] = {
                            key: key,
                            name: deviceitem.name || key,
                            value: 0
                        };
                    }
                    deviceTotals[key].value += Number(deviceitem.value) || 0;
                });
            }
        });
        
        processDeviceData.value = Object.values(deviceTotals);
        console.log('设置的模拟设备数据:', processDeviceData.value);
    } catch (error) {
        console.error('设置模拟设备数据失败:', error);
        // 设置默认数据
        processDeviceData.value = [
            { key: 'desktop', name: '桌面端', value: 10 },
            { key: 'mobile', name: '移动端', value: 5 }
        ];
    }
};

// 设置模拟内容数据（当API失败时使用）- 仅开发环境
const setMockWebsiteData = async (period: string) => {
    if (!import.meta.env.DEV) {
        console.warn('生产环境无法使用模拟数据');
        processWebsiteData.value = [];
        return;
    }
    
    console.log('使用模拟内容数据, period:', period);
    
    try {
        const { mockPieData } = await import('../../mock/data');
        const dataCount = period === 'week' ? 7 : 30;
        const recentData = mockPieData.data.slice(0, dataCount);
        const websiteTotals: Record<string, { key: string, name: string, value: number }> = {};
        
        recentData.forEach((item: any) => {
            if (item.website && Array.isArray(item.website)) {
                item.website.forEach((websiteitem: any) => {
                    const key = websiteitem.key || websiteitem.name || 'unknown';
                    if (!websiteTotals[key]) {
                        websiteTotals[key] = {
                            key: key,
                            name: websiteitem.name || key,
                            value: 0
                        };
                    }
                    websiteTotals[key].value += Number(websiteitem.value) || 0;
                });
            }
        });
        
        processWebsiteData.value = Object.values(websiteTotals);
        console.log('设置的模拟内容数据:', processWebsiteData.value);
    } catch (error) {
        console.error('设置模拟内容数据失败:', error);
        // 设置默认数据
        processWebsiteData.value = [
            { key: 'article', name: '文章', value: 8 },
            { key: 'gallery', name: '图库', value: 3 },
            { key: 'diary', name: '日记', value: 2 }
        ];
    }
};

// 初始化时加载数据
onMounted(() => {
    console.log('组件挂载，开始初始化数据');
    getVisitData(value1.value);
    getDistributionData(value2.value);
});

// 处理访问趋势数据切换
const handleRadioChange = (e: any) => {
    const newPeriod = e.target.value;
    console.log('访问趋势数据切换:', newPeriod);
    getVisitData(newPeriod);
};

// 处理设备和内容分布数据切换
const handleRadioChange2 = (e: any) => {
    const newPeriod = e.target.value;
    console.log('分布数据切换:', newPeriod);
    getDistributionData(newPeriod);
};

// 调试函数（可选，用于手动调试）
const debugData = () => {
    console.log('=== 当前数据状态 ===');
    console.log('visitData:', visitData.value);
    console.log('processDeviceData:', processDeviceData.value);
    console.log('processWebsiteData:', processWebsiteData.value);
    console.log('loading状态:', {
        visitLoading: visitLoading.value,
        deviceLoading: deviceLoading.value,
        contentLoading: contentLoading.value
    });
};

// 将调试函数暴露到全局（开发环境下可用）
if (process.env.NODE_ENV === 'development') {
    (window as any).debugDataView = debugData;
}
</script>

<style scoped>
.data-card {
    width: 100%;
    height: 100%;
    padding: 24px;
    border-radius: 8px;
    background-color: var(--background-topbar);
    transition: all 0.3s ease;
}

.data-card-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16px;
}

.data-card-title-text {
    font-size: 18px;
    font-weight: 600;
    flex: 1;
    color: var(--text-color);
}

/* 深色模式适配 */
[data-theme="dark"] .data-card {
    background-color: var(--background-topbar);
    border-color: var(--gray-700);
}

[data-theme="dark"] .ant-radio-button-wrapper {
    background-color: var(--gray-800);
    border-color: var(--gray-700);
    color: var(--text-color);
}

[data-theme="dark"] .ant-radio-button-wrapper-checked {
    background-color: var(--blue-600);
    border-color: var(--blue-600);
    color: #fff;
}

[data-theme="dark"] .ant-radio-button-wrapper:hover {
    color: var(--blue-400);
}
</style>