/**
 * 全局状态机
 */
export interface GlobalState {
    /**
     * x 方向开启
     */
    xEnable: boolean;
    /**
     * y 方向开启
     */
    yEnable: boolean;
    /**
     * z 方向开启
     */
    zEnable: boolean;

    /**
     * 正在拖拽 x
     */
    xDrag: boolean;
    /**
     * 正在拖拽 y
     */
    yDrag: boolean;
    /**
     * 正在拖拽 z
     */
    zDrag: boolean;

    /**
     * 颜色—红
     */
    posX: number;

    /**
     * 颜色—绿
     */
    posY: number;

    /**
     * 颜色—蓝
     */
    posZ: number;
}