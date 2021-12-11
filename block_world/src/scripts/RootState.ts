/**
 * 全局数据中心
 */
export default class RootState {
    /**
     * 当前的操作类型
     */
    opIndex?: number;

    /**
     * 相机位置 x
     */
    cameraX?: number;

    /**
     * 相机位置 y
     */
    cameraY?: number;
    
    /**
     * canvas 应当刷新吗
     */
    shouldCanvasUpdate?: boolean;
    
    static def: RootState = {
        opIndex: 0,
        cameraX: 0,
        cameraY: 0,
        shouldCanvasUpdate: false
    }
}