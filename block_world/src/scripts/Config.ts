/**
 * 全局环境的配置
 */
namespace config {
    /**
     * 本地存储的时候采用的 key
     */
    export const storageKey = `data27`;

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
     * 聚焦框的宽度
     */
    export const focusFrameBorderSize = 5;

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
    export const bgColor = [
        0.16862745098039217,
        0.16862745098039217,
        0.16862745098039217,
        1
    ];

    /**
     * 格子颜色
     */
    export const gridColor = [
        bgColor[0] * 2,
        bgColor[1] * 2,
        bgColor[2] * 2
    ];

    /**
     * x 轴颜色
     */
     export const xColor = [
        1,
        0,
        0
    ];

    /**
     * y 轴颜色
     */
    export const yColor = [
        0,
        1,
        0
    ];

    /**
     * 聚焦框颜色-抬起
     */
    export const focusFrameReleaseColor = [
        0,
        0,
        1
    ];

    /**
     * 聚焦框颜色-按压
     */
    export const focusFramePressColor = [
        0,
        1,
        1
    ];

    /**
     * 方块的边缘颜色
     */
    export const blockPaddingColor = [
        0,
        0,
        0
    ];

    /**
     * 方块主体颜色
     */
    export const blockBgColor = [
        1,
        1,
        0
    ];

    /**
     * 光源主体颜色
     */
    export const lightBgColor = [
        1,
        1,
        1
    ];

    /**
     * 光源边缘颜色
     */
    export const lightPaddingColor = [
        0,
        0,
        0
    ];
};

export default config;