import BlockGridXRec from "./BlockGridXRec";
import LightGridXRec from "./LightGridXRec";

/**
 * 全局数据结构
 */
export default class MainState {
    /**
     * 版本
     */
    version: number;

    /**
     * 当前的操作类型
     */
    opIndex: number;

    /**
     * 相机位置 x
     */
    cameraX: number;

    /**
     * 相机位置 y
     */
    cameraY: number;

    /**
     * 关闭 webgl
     */
    disableWebgl: boolean;

    /**
     * 聚焦的格子 x
     */
    focusGridX: number;

    /**
     * 聚焦的格子 y
     */
    focusGridY: number;

    /**
     * 当前处于按压状态
     */
    isPressed: boolean;

    /**
     * 方块记录
     */
    blockXRec: BlockGridXRec[];

    /**
     * 光源记录
     */
    lightXRec: LightGridXRec[];

    /**
     * 默认值
     */
    public static def: MainState = {
        version: 0,
        opIndex: 0,
        cameraX: 0,
        cameraY: 0,
        disableWebgl: false,
        focusGridX: 0,
        focusGridY: 0,
        isPressed: false,
        blockXRec: [],
        lightXRec: []
    };
};