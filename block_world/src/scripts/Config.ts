/**
 * 全局环境的配置
 */
namespace config {
    /**
     * 本地存储的时候采用的 key
     */
    export const storageKey = `data25`;

    /**
     * 背景格子的深度
     */
    export const bgGridZ = -0.2;

    /**
     * 背景 xy 轴的深度
     */
    export const xyZ = -0.1;

    /**
     * 方块的深度
     */
    export const blockBgZ = 0;

    /**
     * 方块边缘的深度
     */
    export const blockPaddingZ = 0.01;

    /**
     * 光源背景的深度
     */
    export const lightBgZ = 0.02;

    /**
     * 光源身体的主体的深度
     */
    export const lightBodyZ = 0.03;

    /**
     * 聚焦框的深度
     */
    export const focusFrameZ = 0.1;

    /**
     * 方块边缘厚度
     */
    export const blockPadding = 5;

    /**
     * 方块尺寸
     */
    export const rectSize = 100;
    
    /**
     * 光源尺寸
     */
    export const lightSize = 50;

    /**
     * 光源边缘厚度
     */
    export const lightPadding = 5;

    /**
     * 背景颜色
     */
     export const bgColor = {
        r: 0.16862745098039217,
        g: 0.16862745098039217,
        b: 0.16862745098039217,
        a: 1
    };

    /**
     * 格子颜色
     */
    export const gridColor = {
        r: bgColor.r * 2,
        g: bgColor.g * 2,
        b: bgColor.b * 2
    };

    /**
     * x 轴颜色
     */
     export const xColor = {
        r: 1,
        g: 0,
        b: 0
    };

    /**
     * y 轴颜色
     */
    export const yColor = {
        r: 0,
        g: 1,
        b: 0
    };

    /**
     * 聚焦框颜色-抬起
     */
    export const focusFrameReleaseColor = {
        r: 0,
        g: 0,
        b: 1
    };

    /**
     * 聚焦框颜色-按压
     */
    export const focusFramePressColor = {
        r: 0,
        g: 1,
        b: 1
    };

    /**
     * 方块的边缘颜色
     */
    export const blockPaddingColor = {
        r: 0,
        g: 0,
        b: 0
    };

    /**
     * 方块主体颜色
     */
    export const blockBgColor = {
        r: 1,
        g: 1,
        b: 0
    };

    /**
     * 光源主体颜色
     */
    export const lightBgColor = {
        r: 1,
        g: 1,
        b: 1
    };

    /**
     * 光源边缘颜色
     */
    export const lightPaddingColor = {
        r: 0,
        g: 0,
        b: 0
    };
};

export default config;