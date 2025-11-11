<template>
    <div :style="{height:chartHeight}" ref="chart" class="chart"></div>
</template>




<script setup lang="ts">

import * as echarts from 'echarts/core';

import { ref, onMounted, markRaw, watch, onBeforeUnmount } from 'vue';

import { useThemeStore } from '../../store/theme';
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
import { PieChart } from 'echarts/charts';

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
    PieChart,
    CanvasRenderer,
    LabelLayout,
    UniversalTransition
]);

const themeStore = useThemeStore();
const currentTheme = ref(themeStore.currentTheme);

const chart = ref<HTMLDivElement>();

//创建echarts实例接受父组件传入的option
const mychart = ref();
const props = defineProps(['data', 'title', 'chartHeight']);

const getThemeColors = () => {
    return currentTheme.value === 'dark' ? {
        textColor: '#e0e0e0',
        subTextColor: '#9e9e9e',
        tooltipBg: 'rgba(30, 32, 37, 0.9)',
        tooltipBorder: '1px solid rgba(255, 255, 255, 0.1)',
        legendTextColor: '#e0e0e0',
        borderColor: '#333',
        currentTheme: 'dark',
        // 暗色主题下的饼图颜色
        pieColors: [
            '#4992ff', '#7cffb2', '#fddd60', '#ff6e76', '#58d9f9', 
            '#05c091', '#ff8a45', '#8d48e3', '#dd79ff'
        ]
    } : {
        textColor: '#686B73',
        subTextColor: '#686B73',
        tooltipBg: 'rgba(255, 255, 255, 0.9)',
        tooltipBorder: '1px solid rgba(0, 0, 0, 0.1)',
        legendTextColor: '#686B73',
        borderColor: '#fff',
        currentTheme: 'light',
        // 亮色主题下的饼图颜色
        pieColors: [
            '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5AC8FA', 
            '#00C7BE', '#FF9500', '#AF52DE', '#FF2D55'
        ]
    };
};

const option = ref({
    title: {
        text: '',
        subtext: '',
        left: 'center',
        top: 'center',
        textStyle: {
            fontSize: 32,
            fontWeight: 'bold',
            color: getThemeColors().textColor,
            align: 'center'
        },
        subtextStyle: {
            fontSize: 14,
            color: getThemeColors().subTextColor,
            align: 'center',
            padding: [5, 0, 0, 0]
        },
    },
    tooltip: {
        trigger: 'item',
        backgroundColor: getThemeColors().tooltipBg,
        borderColor: getThemeColors().tooltipBorder,
        textStyle: {
            color: getThemeColors().textColor
        }
    },
    legend: {
        top: '5%',
        left: 'center',
        bottom: 0,
        icon: 'circle',
        itemGap: 15,
        textStyle: {
            color: getThemeColors().legendTextColor
        }
    },
    color: getThemeColors().pieColors,
    series: [{
        name: 'Access From',
        type: 'pie',
        radius: ['60%', '76%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
            borderRadius: 4,
            borderWidth: 2,
            borderColor: getThemeColors().borderColor,
            shadowBlur: 5,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
        },
        label: {
            show: false
        },
        emphasis: {
            itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
            },
            label: {
                show: true,
                formatter: '{b}: {c} ({d}%)',
                color: getThemeColors().textColor,
                fontWeight: 'bold'
            }
        },
        labelLine: {
            show: false
        },
        data: [] as { value: number; name: string }[],
    }]
});

const survey = (e: { value: number; name: string }[]) => {
    if (!e || !Array.isArray(e)) {
        console.warn('数据无效或为空');
        return;
    }

    let total: number = 0;
    for(let i = 0; i < e.length; i++){
        total += e[i].value;
    }

    const colors = getThemeColors();
    option.value = {
        ...option.value,
        title: {
            ...option.value.title,
            text: total.toString(),
            subtext: props.title,
            textStyle: {
                ...option.value.title.textStyle,
                color: colors.textColor
            },
            subtextStyle: {
                ...option.value.title.subtextStyle,
                color: colors.subTextColor,
                align: 'center',
                padding: [5, 0, 0, 0]
            }
        },
        tooltip: {
            ...option.value.tooltip,
            backgroundColor: colors.tooltipBg,
            borderColor: colors.tooltipBorder,
            textStyle: {
                color: colors.textColor
            }
        },
        legend: {
            ...option.value.legend,
            itemGap: 15,
            textStyle: {
                color: colors.legendTextColor
            }
        },
        color: colors.pieColors,
        series: [{
            ...option.value.series[0],
            data: e,
            radius: ['60%', '76%'],
            center: ['50%', '50%'],
            itemStyle: {
                borderRadius: 4,
                borderWidth: 2,
                borderColor: colors.borderColor,
                shadowBlur: 5,
                shadowColor: 'rgba(0, 0, 0, 0.2)'
            },
            label: {
                show: false
            },
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                },
                label: {
                    show: true,
                    formatter: '{b}: {c} ({d}%)',
                    color: colors.textColor,
                    fontWeight: 'bold'
                }
            }
        }]
    };
}

// 使用内存管理
const memoryManager = useMemoryManagement({
    componentName: 'EchartsPie',
    trackEventListeners: true,
    trackObservers: true,
    autoCleanup: true
});

survey(props.data);

// 监听主题变化
watch(
    () => themeStore.currentTheme,
    (newTheme) => {
        currentTheme.value = newTheme;
        if (mychart.value && !mychart.value.isDisposed()) {
            survey(props.data);
            mychart.value.setOption(option.value);
        }
    }
);

onMounted(() => {
    if (!chart.value) return;
    
    mychart.value = markRaw(echarts.init(chart.value as HTMLDivElement));
    mychart.value.setOption(option.value);

    // 使用内存管理的addEventListener方法
    const resizeHandler = () => {
        if (mychart.value && !mychart.value.isDisposed()) {
            mychart.value.resize();
        }
    };
    
    memoryManager.addEventListener(window, 'resize', resizeHandler);
});

watch(
    () => props.data,
    (newData) => {
        survey(newData);
        if (mychart.value) {
            mychart.value.setOption(option.value);
        }
    }
);

onBeforeUnmount(() => {
    // 销毁echarts实例
    if (mychart.value && !mychart.value.isDisposed()) {
        mychart.value.dispose();
        mychart.value = null;
    }
    
    // 内存管理器会自动清理事件监听器和其他资源
    console.log('🥧 PieChart 组件清理完成');
});

</script>

<style scoped>

.chart {
    width: 100%;
}

</style>

