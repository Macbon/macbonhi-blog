<template>
    <div :style="{height:chartHeight}" ref="chart" class="chart"></div>
</template>

<script setup lang="ts">


import * as echarts from 'echarts/core';

import { ref, onMounted, markRaw, watch, onBeforeUnmount } from 'vue';
import { useMemoryManagement } from '../../composables/useMemoryManagement';

//引入提示框，标题，直角坐标系，数据集，内置数据转换器组件，组件后缀为Component
import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    DatasetComponent,
    TransformComponent,
    LegendComponent,
} from 'echarts/components';

//引入折线、饼图组件
import { LineChart } from 'echarts/charts';

import { LabelLayout, UniversalTransition } from 'echarts/features';
//引入Canvas渲染器  
import { CanvasRenderer } from 'echarts/renderers';



echarts.use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    DatasetComponent,
    TransformComponent,
    LegendComponent,
    LineChart,
    CanvasRenderer,
    LabelLayout,
    UniversalTransition
]);

const chart = ref<HTMLDivElement>();

//创建echarts实例接受父组件传入的option
const mychart = ref();
const props = defineProps(['data', 'chartHeight']);

const xAxisData = ref<string[]>([]);
const seriesData = ref<number[]>([]);
const option = ref();

const visit = (e: any) => { 


    xAxisData.value = [];
    seriesData.value = [];

    // 添加数据验证
    if (!e || !Array.isArray(e)) {
        console.warn('数据无效或为空');
        return;
    }

    for (let i = 0; i < e.length; i++) {
        // 格式化日期，从UTC时间转为本地时间格式
        const dateObj = new Date(e[i].date);
        const formattedDate = `${dateObj.getMonth()+1}-${dateObj.getDate()}`; // 仅显示月-日
        
        xAxisData.value.push(formattedDate);
        seriesData.value.push(e[i].value);
    }
    //设置option进行偏好设置
    option.value = {
        color: ['#007AFF'],
        grid: {
            top: '4%',
            left: '0%',
            right: '0%',
            bottom: '0%',
            containLabel: true
        },
        //x轴设置
        xAxis: {
            type: 'category',
            data: xAxisData.value
        },
        //y轴设置
        yAxis: {
            type: 'value',
        },
        //series设置
        series: [
            {
                data: seriesData.value,
                type: 'line',
                smooth: true,

        
            }
        ]
        
    }

}

// 使用内存管理
const memoryManager = useMemoryManagement({
    componentName: 'EchartsLine',
    trackEventListeners: true,
    trackObservers: true,
    autoCleanup: true
});

//为了实时变化，使用onMounted进行监听
onMounted(() => {
    if (!chart.value) return;

    mychart.value = markRaw(echarts.init(chart.value as HTMLDivElement));

    // 如果有数据，才设置选项
    if (props.data && Array.isArray(props.data)) {
        visit(props.data);
        mychart.value.setOption(option.value);
    } else {
        // 设置一个空的图表
        mychart.value.setOption({
            xAxis: { type: 'category', data: [] },
            yAxis: { type: 'value' },
            series: [{ type: 'line', data: [] }]
        });
    }
    
    // 使用内存管理的addEventListener方法
    const resizeHandler = () => {
        if (mychart.value && !mychart.value.isDisposed()) {
            mychart.value.resize();
        }
    };
    
    memoryManager.addEventListener(window, 'resize', resizeHandler);
})

//如果data发生了改变我们继续去执行onMounted
watch(
    () => props.data,
    (newData) => {
        if (newData && Array.isArray(newData)) {
            visit(newData);
            // 只更新图表配置，不重新创建实例
            mychart.value.setOption(option.value);
        }
})

//组件销毁前一定要清理资源，防止内存泄漏
onBeforeUnmount(() => {
    // 销毁echarts实例
    if (mychart.value && !mychart.value.isDisposed()) {
        mychart.value.dispose();
        mychart.value = null;
    }
    
    // 内存管理器会自动清理事件监听器和其他资源
    console.log('📊 LineChart 组件清理完成');
})


</script>

<style scoped>

.chart {
    width: 100%;

}
</style>
