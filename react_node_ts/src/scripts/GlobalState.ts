/**
 * 全局状态机
 */
export interface GlobalState {
    /**
     * 红开启
     */
    redEnable: boolean;

    /**
     * 绿开启
     */
    greenEnable: boolean;

    /**
     * 蓝开启
     */
    blueEnable: boolean;
}