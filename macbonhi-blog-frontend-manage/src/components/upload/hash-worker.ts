// 声明 SparkMD5 类型
declare var SparkMD5: {
  ArrayBuffer: new () => {
    append: (arr: ArrayBuffer) => void;
    end: () => string;
  };
};

// 声明 Worker 全局上下文
declare const self: {
  postMessage: (message: any) => void;
  onmessage: (event: MessageEvent) => void;
  addEventListener: (type: string, listener: (event: MessageEvent) => void, options?: boolean | AddEventListenerOptions) => void;
  importScripts: (...urls: string[]) => void;
  SparkMD5: typeof SparkMD5;
};

// 导入 SparkMD5 库
self.importScripts('https://cdnjs.cloudflare.com/ajax/libs/spark-md5/3.0.2/spark-md5.min.js');

// 文件切片类型
interface FileChunk {
  chunk: Blob;
}

// 创建文件切片
function createFileChunk(file: File, chunkSize: number): FileChunk[] {
  const fileChunkList: FileChunk[] = [];
  let cur = 0;
  while (cur < file.size) {
    fileChunkList.push({ 
      chunk: file.slice(cur, cur + chunkSize) 
    });
    cur += chunkSize;
  }
  return fileChunkList;
}

// 计算文件哈希
self.onmessage = async (e: MessageEvent) => {
  const { file, chunkSize } = e.data as { file: File; chunkSize: number };
  
  try {
    // 创建文件切片
    const fileChunkList = createFileChunk(file, chunkSize);
    
    // 初始化SparkMD5实例
    const spark = new self.SparkMD5.ArrayBuffer();
    
    // 计算进度变量
    let count = 0;
    const totalChunks = fileChunkList.length;
    let percentage = 0;
    
    // 通知进度
    self.postMessage({ 
      percentage, 
      status: 'calculating' 
    });
    
    // 读取每个切片并更新哈希
    for (let i = 0; i < totalChunks; i++) {
      const { chunk } = fileChunkList[i];
      
      // 使用FileReader读取切片内容
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(chunk);
        reader.onload = (e) => {
          if (e.target && e.target.result) {
            resolve(e.target.result as ArrayBuffer);
          } else {
            reject(new Error("Failed to read file chunk"));
          }
        };
        reader.onerror = (e) => {
          reject(e);
        };
      });
      
      // 添加到spark
      spark.append(arrayBuffer);
      
      // 更新计算进度
      count++;
      percentage = Math.floor((count / totalChunks) * 100);
      self.postMessage({ 
        percentage, 
        status: 'calculating' 
      });
    }
    
    // 计算最终哈希值
    const fileHash = spark.end();
    
    // 完成并返回结果
    self.postMessage({ 
      percentage: 100, 
      status: 'complete', 
      fileHash,
      fileChunkList: fileChunkList.map(({ chunk }, index) => ({
        index,
        hash: `${fileHash}-${index}`,
        chunk
      }))
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    self.postMessage({ 
      status: 'error', 
      message: errorMessage
    });
  }
};
