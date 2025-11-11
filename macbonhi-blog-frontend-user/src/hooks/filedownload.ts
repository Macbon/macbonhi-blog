import { ref } from 'vue';
import { getDownloadableFilesApi, downloadFileApi } from '../api/index';
import { message } from 'ant-design-vue';

export interface FileData {
  id: number | string;
  file_name: string;
  file_url: string;
  url: string;
  file_desc?: string;
  file_size?: number;
  subset_id?: number;
  download_count?: number;
  format?: string;
  moment?: string;
}

export const useFile = () => {
  // 文件列表数据
  const fileList = ref<FileData[]>([]);
  // 文件总数
  const count = ref<number>(0);
  // 加载状态
  const loading = ref<boolean>(false);
  // 下载中状态
  const downloading = ref<boolean>(false);
  
  // 获取文件数据
  const getdata = async (params: any, append = false) => {
    if (loading.value) return;
    
    loading.value = true;
    
    try {
      // 转换参数
      const requestData = {
        token: params.token,
        pagesize: params.pageSize || 8,
        nowpage: params.nowPage || 1,
        subsetId: params.subsetId !== undefined ? params.subsetId : -1,
        count: params.count || true
      };
      
      
      const res = await getDownloadableFilesApi(requestData);
      
      // 检查返回的数据格式
      if (res.data) {
        // 检查是否直接返回了数据而不是标准格式
        if (res.data.total !== undefined && Array.isArray(res.data.data)) {
          // 直接返回了 {total: X, data: [...]} 格式
          const newData = res.data.data || [];
          
          if (append) {
            fileList.value = [...fileList.value, ...newData];
          } else {
            fileList.value = newData;
          }
          
          // 获取文件总数
          if (params.count && res.data.total !== undefined) {
            count.value = res.data.total;
          }
          
          return;
        }
        
        // 标准格式 {code: 200, data: {total: X, data: [...]}}
        if (res.code === 200) {
          if (append) {
            fileList.value = [...fileList.value, ...res.data.data.data];
          } else {
            fileList.value = res.data.data || [];
          }
          
          // 获取文件总数
          if (params.count && res.data.total !== undefined) {
            count.value = res.data.total;
          }
          
          return;
        }
        
        // 其他情况，可能是错误响应
        console.error('API返回的数据格式不符合预期:', res.data);
        message.error(res.data?.message || '获取文件失败');
      } else {
        console.error('API没有返回数据');
        message.error('获取文件失败，服务器没有返回数据');
      }
    } catch (error) {
      console.error('获取文件失败', error);
      message.error('获取文件失败');
    } finally {
      loading.value = false;
    }
  };
  
  // 下载文件
const downloadFile = async (fileId: string | number, token: string) => {
    if (downloading.value) return;
    
    downloading.value = true;
    
    try {
      console.log('开始下载文件:', fileId);
      
      const response = await downloadFileApi({
        fileId,
        token: token
      });
      
      console.log('原始响应:', response);
      console.log('响应类型:', typeof response);
      console.log('响应构造函数:', response?.constructor?.name);
      
      let blob: Blob;
      let fileName = '';
      let responseHeaders: any = {};
      
      // 处理不同的响应格式
      if (response instanceof Blob) {
        // 直接是 Blob 对象
        console.log('响应是直接的 Blob 对象');
        blob = response;
        
        // 尝试从其他地方获取文件名
        const fileItem = fileList.value.find(item => item.id === fileId);
        fileName = fileItem ? fileItem.file_name : `download-${fileId}`;
        
      } else if (response && response.data instanceof Blob) {
        // 标准的 axios 响应格式
        console.log('响应是标准的 axios 格式');
        blob = response.data;
        responseHeaders = response.headers || {};
        
        // 尝试从响应头获取文件名
        const contentDisposition = responseHeaders['content-disposition'] || 
                                  responseHeaders['Content-Disposition'] || '';
        
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/) || 
                                contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (fileNameMatch && fileNameMatch[1]) {
            fileName = decodeURIComponent(fileNameMatch[1].replace(/['"]/g, ''));
          }
        }
        
        // 如果还是没有文件名，从文件列表获取
        if (!fileName) {
          const fileItem = fileList.value.find(item => item.id === fileId);
          fileName = fileItem ? fileItem.file_name : `download-${fileId}`;
        }
        
      } else if (response && typeof response === 'object' && response.data) {
        // 处理其他类型的响应
        console.log('响应包含data字段，尝试创建Blob');
        blob = new Blob([response.data]);
        
        const fileItem = fileList.value.find(item => item.id === fileId);
        fileName = fileItem ? fileItem.file_name : `download-${fileId}`;
        
      } else {
        console.error('未知的响应格式:', response);
        message.error('下载失败：响应格式不正确');
        return;
      }
      
      console.log('处理后的 Blob 信息:', { 
        size: blob.size, 
        type: blob.type,
        fileName: fileName
      });
      
      // 检查 blob 是否有效
      if (!blob || blob.size === 0) {
        message.error('下载失败：文件为空');
        return;
      }
      
      // 检查是否是错误响应（可能是 JSON）
      if (blob.type === 'application/json' || blob.size < 1000) {
        try {
          const text = await blob.text();
          const jsonResponse = JSON.parse(text);
          if (jsonResponse.code && jsonResponse.code !== 200) {
            console.error('服务器返回错误:', jsonResponse);
            message.error(jsonResponse.message || '下载文件失败');
            return;
          }
        } catch (e) {
          // 不是 JSON，继续下载流程
        }
      }
      
      console.log('开始创建下载链接，文件名:', fileName);
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      
      // 添加到文档并点击（兼容性更好的方式）
      document.body.appendChild(link);
      link.style.display = 'none';
      link.click();
      
      // 延迟清理，确保下载开始
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      // 更新下载计数
      const fileItem = fileList.value.find(item => item.id === fileId);
      if (fileItem) {
        fileItem.download_count = (fileItem.download_count || 0) + 1;
      }
      
      message.success('文件下载成功');
      
    } catch (error: any) {
      console.error('下载文件失败', error);
      
      // 详细的错误信息
      if (error.response) {
        console.error('错误响应:', error.response);
        const status = error.response.status;
        
        if (status === 404) {
          message.error('文件不存在或已被删除');
        } else if (status === 403) {
          message.error('没有权限下载此文件');
        } else if (status === 500) {
          message.error('服务器内部错误');
        } else {
          message.error(`下载失败：HTTP ${status}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        message.error('下载超时，请稍后再试');
      } else if (error.message) {
        message.error(`下载失败：${error.message}`);
      } else {
        message.error('下载文件失败，请稍后再试');
      }
    } finally {
      downloading.value = false;
    }
  };
  
  return {
    fileList,
    count,
    loading,
    downloading,
    getdata,
    downloadFile
  };
}; 