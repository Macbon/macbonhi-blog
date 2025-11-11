import { ref } from 'vue';
import { getDiaryApi, getDiaryByDateApi, getNearestDiaryApi } from '../api';
import type { DiaryData } from '../utils/typeof';
import { useCode } from './code';
const { tackleCode } = useCode();

export function useDiary() {
  const diaryList = ref<DiaryData[]>([]);
  const count = ref<number>(0);
  const loading = ref<boolean>(false);
  // 存储日记日期
  const diaryDates = ref<Date[]>([]);
  
  //获取日记数据
  const getdata = async (params: any, append = false) => {
    loading.value = true;
    try {
      const res = await getDiaryApi(params);
      if (tackleCode(res.code)) {
        if (!append) {
          diaryList.value = res.data.result || [];
        } else {
          // 追加模式
          diaryList.value = [...diaryList.value, ...(res.data.result || [])];
        }
        
        // 处理日记日期数据
        if (res.data.dates && Array.isArray(res.data.dates)) {
          const dates = res.data.dates.map((dateStr: string) => new Date(dateStr));
          diaryDates.value = dates;
        }
        
        count.value = res.data.count || 0;
      }
    } catch (error) {
      console.error('获取日记数据失败', error);
    } finally {
      loading.value = false;
    }
    return diaryList.value;
  };
  
  // 获取特定日期的日记
  const getDiaryByDate = async (date: Date, token: string) => {
    loading.value = true;
    
    try {
      const params = {
        token,
        date: formatDateString(date)
      };
      
      const res = await getDiaryByDateApi(params);
      
      if (tackleCode(res.code) && res.data) {
        return res.data;
      }
      return null;
    } catch (error) {
      console.error('获取特定日期日记失败', error);
      return null;
    } finally {
      loading.value = false;
    }
  };
  
  // 获取最近的日记
  const getNearest = async (date: Date, token: string) => {
    loading.value = true;
    
    try {
      const params = {
        token,
        date: formatDateString(date)
      };
      
      const res = await getNearestDiaryApi(params);
      
      if (tackleCode(res.code) && res.data) {
        return res.data;
      }
      return null;
    } catch (error) {
      console.error('获取最近日记失败', error);
      return null;
    } finally {
      loading.value = false;
    }
  };
  
  // 格式化日期为YYYY-MM-DD
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    diaryList,
    diaryDates,
    count,
    loading,
    getdata,
    getDiaryByDate,
    getNearest
  };
}
