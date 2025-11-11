/**
 * 大文件分片上传示例
 * 
 * 这个文件是一个前端示例，展示如何使用分片上传功能
 * 可以将此代码整合到您的前端项目中
 */

// 配置参数
const API_BASE_URL = 'http://localhost:3000/api/file'; // 根据实际情况修改
const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB 每个分片大小

// 计算文件Hash (使用一个简化的方式，真实环境可能需要更复杂的处理)
async function calculateHash(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target.result;
      // 简化的hash计算，实际应用中可以使用更安全的算法
      const hash = Array.from(new Uint8Array(result.slice(0, 1024)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('') + file.size; // 附加文件大小增加唯一性
      resolve(hash);
    };
    reader.readAsArrayBuffer(file.slice(0, 1024)); // 只读取文件的前1KB进行hash计算
  });
}

// 分片文件
function createFileChunks(file, chunkSize = CHUNK_SIZE) {
  const chunks = [];
  let cur = 0;
  while (cur < file.size) {
    chunks.push(file.slice(cur, cur + chunkSize));
    cur += chunkSize;
  }
  return chunks;
}

// 计算分片的MD5
async function calculateChunkHash(chunk) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const spark = new SparkMD5.ArrayBuffer();
      spark.append(e.target.result);
      const hash = spark.end();
      resolve(hash);
    };
    reader.readAsArrayBuffer(chunk);
  });
}

// 上传文件
async function uploadFile(file, onProgress) {
  try {
    // 1. 计算文件hash
    const fileHash = await calculateHash(file);
    
    // 2. 分割文件
    const chunks = createFileChunks(file);
    
    // 3. 初始化上传
    const initResponse = await fetch(`${API_BASE_URL}/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileHash,
        fileName: file.name,
        fileSize: file.size,
        chunkSize: CHUNK_SIZE,
        totalChunks: chunks.length
      })
    });
    
    const initResult = await initResponse.json();
    
    // 检查是否已经上传过（秒传）
    if (initResult.data.uploaded) {
      onProgress && onProgress(100);
      return {
        success: true,
        path: initResult.data.path,
        message: '文件已存在，秒传成功！'
      };
    }
    
    // 4. 上传分片
    const uploadPromises = chunks.map(async (chunk, index) => {
      // 计算分片的hash
      const chunkHash = await calculateChunkHash(chunk);
      
      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('fileHash', fileHash);
      formData.append('chunkIndex', index);
      formData.append('chunkHash', chunkHash);
      
      const response = await fetch(`${API_BASE_URL}/chunk`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      // 更新进度
      onProgress && onProgress(Math.floor((index + 1) / chunks.length * 100));
      
      return result;
    });
    
    await Promise.all(uploadPromises);
    
    // 5. 合并分片
    const mergeResponse = await fetch(`${API_BASE_URL}/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileHash,
        subsetId: 0 // 默认的子集ID，可以根据需要修改
      })
    });
    
    const mergeResult = await mergeResponse.json();
    
    return {
      success: mergeResult.code === 200,
      data: mergeResult.data,
      message: '上传成功！'
    };
  } catch (error) {
    console.error('上传出错:', error);
    return {
      success: false,
      message: '上传失败: ' + error.message
    };
  }
}

// 使用示例
const fileUploader = {
  // 选择文件并上传
  async uploadBySelection() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = false;
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const result = await uploadFile(file, (progress) => {
          console.log(`上传进度: ${progress}%`);
        });
        
        resolve(result);
      };
      
      input.click();
    });
  },
  
  // 拖拽上传
  initDropZone(element) {
    element.addEventListener('dragover', (e) => {
      e.preventDefault();
      element.classList.add('dragover');
    });
    
    element.addEventListener('dragleave', () => {
      element.classList.remove('dragover');
    });
    
    element.addEventListener('drop', async (e) => {
      e.preventDefault();
      element.classList.remove('dragover');
      
      const file = e.dataTransfer.files[0];
      if (!file) return;
      
      const progressElement = document.createElement('div');
      progressElement.className = 'progress';
      element.appendChild(progressElement);
      
      const result = await uploadFile(file, (progress) => {
        progressElement.style.width = `${progress}%`;
        progressElement.textContent = `${progress}%`;
      });
      
      setTimeout(() => {
        progressElement.remove();
        alert(result.message);
      }, 1000);
    });
  }
};

// 导出模块
export default fileUploader; 