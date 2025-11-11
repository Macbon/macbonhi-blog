// 🔍 调试工具 - 用于检查数据加载问题
import { baseUrl } from './env';

/**
 * 诊断API连接性
 */
export const diagnoseAPI = async () => {
  console.log('🔍 开始API连接诊断...');
  console.log('📍 当前baseUrl:', baseUrl);
  console.log('🌐 当前页面URL:', window.location.href);
  
  // 检查基础网络连接
  try {
    const response = await fetch('/api/overview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: '' })
    });
    
    console.log('📡 API响应状态:', response.status);
    console.log('📡 API响应头:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.text();
      console.log('✅ API连接正常，响应数据:', data);
    } else {
      console.error('❌ API响应异常:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ API连接失败:', error);
  }
};

/**
 * 诊断文章API
 */
export const diagnoseArticleAPI = async () => {
  console.log('🔍 开始文章API诊断...');
  
  const testParams = {
    nowpage: 1,
    pagesize: 6,
    count: true,
    classify: 0 // 文章类型
  };
  
  try {
    const response = await fetch('/api/article', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testParams)
    });
    
    console.log('📰 文章API响应状态:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 文章API连接正常，数据结构:', {
        code: data.code,
        dataType: typeof data.data,
        resultLength: data.data?.result?.length || 0,
        count: data.data?.count || 0
      });
    } else {
      console.error('❌ 文章API响应异常:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ 文章API连接失败:', error);
  }
};

/**
 * 诊断图库API
 */
export const diagnoseGalleryAPI = async () => {
  console.log('🔍 开始图库API诊断...');
  
  const testParams = {
    nowpage: 1,
    pagesize: 6,
    count: true,
    classify: 1 // 图库类型
  };
  
  try {
    const response = await fetch('/api/article', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testParams)
    });
    
    console.log('🖼️ 图库API响应状态:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 图库API连接正常，数据结构:', {
        code: data.code,
        dataType: typeof data.data,
        resultLength: data.data?.result?.length || 0,
        count: data.data?.count || 0
      });
    } else {
      console.error('❌ 图库API响应异常:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ 图库API连接失败:', error);
  }
};

/**
 * 运行完整诊断
 */
export const runFullDiagnosis = async () => {
  console.log('🚀 开始完整系统诊断...');
  console.log('==================================');
  
  await diagnoseAPI();
  console.log('----------------------------------');
  
  await diagnoseArticleAPI();
  console.log('----------------------------------');
  
  await diagnoseGalleryAPI();
  console.log('==================================');
  
  console.log('🏁 诊断完成，请查看上述日志');
};

// 在开发环境下自动添加到window对象，方便调试
if (import.meta.env.DEV) {
  (window as any).debugAPI = {
    diagnoseAPI,
    diagnoseArticleAPI,
    diagnoseGalleryAPI,
    runFullDiagnosis
  };
  
  console.log('🛠️ 调试工具已加载到 window.debugAPI');
  console.log('💡 使用方法: window.debugAPI.runFullDiagnosis()');
}