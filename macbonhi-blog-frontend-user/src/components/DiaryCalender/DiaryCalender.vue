<template>
  <div class="diary-calendar">
    <!-- 日历顶部控制栏 -->
    <div class="calendar-header">
      <button class="month-nav" @click="prevMonth">
        <span class="nav-icon">&lt;</span>
      </button>
      <div class="calendar-title">
        {{ currentYear }}年{{ currentMonth + 1 }}月
      </div>
      <button class="month-nav" @click="nextMonth">
        <span class="nav-icon">&gt;</span>
      </button>
      <button class="today-btn" @click="goToToday">今天</button>
    </div>

    <!-- 周几标题栏 -->
    <div class="weekdays">
      <span v-for="day in weekdays" :key="day">{{ day }}</span>
    </div>

    <!-- 日历日期格 -->
    <div class="calendar-grid">
      <div 
        v-for="(day, index) in calendarDays" 
        :key="index"
        class="calendar-day"
        :class="{
          'other-month': !day.currentMonth,
          'today': day.isToday,
          'has-diary': day.hasDiary,
          'selected': isSelected(day.date)
        }"
        @click="selectDate(day)"
      >
        {{ day.dayOfMonth }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useDiary } from '../../hooks/diary';
import { useUserStore } from '../../store/user';
import type { DiaryData } from '../../utils/typeof';

// 接收父组件传递的props
const props = defineProps({
  initialDate: {
    type: Date,
    default: () => new Date()
  },
  diaryDates: {
    type: Array as () => Date[],
    default: () => []
  }
});

// 定义事件
const emit = defineEmits(['dateSelected', 'monthChanged']);

// 使用store获取token
const userStore = useUserStore();

// 使用日记API hook
const { diaryList, getdata } = useDiary();

// 定义状态
const currentDate = ref(props.initialDate);
const selectedDate = ref<Date | null>(null);
const diaryDateMap = ref<Map<string, boolean>>(new Map());

// 计算当前年份和月份
const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth());

// 星期标题
const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

// 生成当月的日历数据
const calendarDays = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  
  // 获取当月第一天是周几
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay(); // 0是周日，1是周一
  
  // 获取当月最后一天的日期
  const lastDay = new Date(year, month + 1, 0);
  const lastDate = lastDay.getDate();
  
  // 获取上个月的最后几天
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  
  // 今天的日期
  const today = new Date();
  
  const days = [];
  
  // 添加上个月的最后几天
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const prevDate = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({
      date: prevDate,
      dayOfMonth: prevMonthLastDay - i,
      currentMonth: false,
      isToday: false,
      hasDiary: hasDiaryOnDate(prevDate)
    });
  }
  
  // 添加当月的天数
  for (let i = 1; i <= lastDate; i++) {
    const date = new Date(year, month, i);
    days.push({
      date,
      dayOfMonth: i,
      currentMonth: true,
      isToday: isSameDay(date, today),
      hasDiary: hasDiaryOnDate(date)
    });
  }
  
  // 添加下个月的前几天
  const remainingDays = 42 - days.length; // 6行7列固定格式
  for (let i = 1; i <= remainingDays; i++) {
    const nextDate = new Date(year, month + 1, i);
    days.push({
      date: nextDate,
      dayOfMonth: i,
      currentMonth: false,
      isToday: false,
      hasDiary: hasDiaryOnDate(nextDate)
    });
  }
  
  return days;
});

// 检查某日期是否有日记
function hasDiaryOnDate(date: Date): boolean {
  const dateStr = formatDate(date);
  return diaryDateMap.value.has(dateStr);
}

// 格式化日期为YYYY-MM-DD字符串
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 比较两个日期是否是同一天
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// 检查日期是否被选中
function isSelected(date: Date): boolean {
  return selectedDate.value !== null && isSameDay(date, selectedDate.value);
}

// 选择日期
function selectDate(day: { date: Date; hasDiary: boolean; currentMonth: boolean }) {
  selectedDate.value = day.date;
  emit('dateSelected', day.date, day.hasDiary);
  
  // 如果选择了非当月日期，切换到对应月份
  if (!day.currentMonth) {
    currentDate.value = new Date(day.date);
    emit('monthChanged', currentDate.value);
  }
}

// 上个月
function prevMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1);
  emit('monthChanged', currentDate.value);
  loadMonthDiaries();
}

// 下个月
function nextMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1);
  emit('monthChanged', currentDate.value);
  loadMonthDiaries();
}

// 回到今天
function goToToday() {
  const today = new Date();
  currentDate.value = today;
  selectedDate.value = today;
  emit('dateSelected', today, hasDiaryOnDate(today));
  emit('monthChanged', today);
  loadMonthDiaries();
}

// 加载当月有日记的日期
async function loadMonthDiaries() {
  const year = currentYear.value;
  const month = currentMonth.value;
  
  // 获取本月第一天和最后一天
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  
  const params = {
    token: userStore.token,
    value: {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      getDates: true,
      pageSize: 100, // 获取足够多的记录来判断哪些日期有日记
      nowPage: 1
    }
  };
  
  try {
    // 使用常规日记列表API获取该月所有日记
    await getdata(params, false);
    
    // 更新日记日期映射
    updateDiaryDateMap();
  } catch (error) {
    console.error('获取当月日记日期失败', error);
  }
}

// 更新日记日期映射
function updateDiaryDateMap() {
  const map = new Map<string, boolean>();
  
  diaryList.value.forEach(diary => {
    if (diary.moment) {
      const date = new Date(diary.moment);
      const dateStr = formatDate(date);
      map.set(dateStr, true);
    }
  });
  
  diaryDateMap.value = map;
}

// 监听diaryDates变化
watch(() => props.diaryDates, () => {
  updateDiaryDateMap();
}, { deep: true });

// 组件挂载时加载当月日记
onMounted(() => {
  // 默认选中今天
  selectedDate.value = new Date();
  
  // 加载当月有日记的日期
  loadMonthDiaries();
});
</script>

<style scoped>
.diary-calendar {
  background-color: var(--background-topbar);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.calendar-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  justify-content: space-between;
}

.calendar-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  flex: 1;
  text-align: center;
}

.month-nav {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  color: var(--text-color);
  transition: all 0.2s ease;
}

.month-nav:hover {
  background-color: var(--gray-200);
}

.today-btn {
  background: none;
  border: none;
  font-size: 14px;
  color: var(--blue-600);
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 16px;
  transition: all 0.2s ease;
}

.today-btn:hover {
  background-color: var(--blue-100);
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 14px;
  color: var(--gray-500);
  margin-bottom: 8px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 4px;
}

.calendar-day {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 36px;
  font-size: 14px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-color);
  transition: all 0.2s ease;
}

.calendar-day:hover {
  background-color: var(--gray-200);
}

.other-month {
  color: var(--gray-400);
}

.today {
  font-weight: 600;
  color: var(--blue-600);
  background-color: var(--blue-50);
}

.has-diary::after {
  content: '';
  position: absolute;
  bottom: 6px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: var(--blue-600);
}

.selected {
  background-color: var(--blue-600);
  color: white;
  font-weight: 600;
}

.selected.has-diary::after {
  background-color: white;
}

/* 深色模式适配 */
[data-theme="dark"] .month-nav:hover {
  background-color: var(--gray-800);
}

[data-theme="dark"] .today-btn:hover {
  background-color: rgba(64, 158, 255, 0.2);
}

[data-theme="dark"] .today {
  background-color: rgba(64, 158, 255, 0.2);
  color: var(--blue-400);
}

[data-theme="dark"] .has-diary::after {
  background-color: var(--blue-400);
}

[data-theme="dark"] .calendar-day:hover {
  background-color: var(--gray-700);
}

[data-theme="dark"] .selected {
  background-color: var(--blue-500);
}
</style>
