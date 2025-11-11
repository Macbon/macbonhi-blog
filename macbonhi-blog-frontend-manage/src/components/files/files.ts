import type { FilesData } from "../../utils/typeof";

export type filesProps = {
    pageSize: number;
    height?: string;
    subsetId: number | string;
}


export type filesbodyprops = {
    data?: FilesData;
}