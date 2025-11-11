// 文件相关类型声明
declare module '../../hooks/file' {
  import { Ref } from 'vue';

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

  export function useFile(): {
    fileList: Ref<FileData[]>;
    count: Ref<number>;
    loading: Ref<boolean>;
    downloading: Ref<boolean>;
    getdata: (params: any, append?: boolean) => Promise<void>;
    downloadFile: (fileId: string | number, token: string) => Promise<void>;
  };
} 