import type { replyData } from '../../utils/typeof';


export type replyProps = {
    pageSize: number;
    height?: string;
}


export type commentsprops = {
    content?: replyData;
    isComment: boolean;

}

export type privatemessageProps = {
    open: boolean;
    pageSize: number;
}

