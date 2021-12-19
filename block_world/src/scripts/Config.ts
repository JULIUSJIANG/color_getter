/**
 * 全局环境的配置
 */
namespace config {
    /**
     * 本地存储的时候采用的 key
     */
    export const storageKey = `data27`;

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
    export const rectSize = 20;
    
    /**
     * 光源尺寸
     */
    export const lightSize = rectSize / 2;

    /**
     * 光源边缘厚度
     */
    export const lightPadding = rectSize / 10;
    
    /**
     * 光照距离
     */
    export const lightDistance = 300;

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
        bgColor[2] * 2,
        1
    ];

    /**
     * x 轴颜色
     */
     export const xColor = [
        1,
        0,
        0,
        1
    ];

    /**
     * y 轴颜色
     */
    export const yColor = [
        0,
        1,
        0,
        1
    ];

    /**
     * 聚焦框颜色-抬起
     */
    export const focusFrameReleaseColor = [
        0,
        0,
        1,
        1
    ];

    /**
     * 聚焦框颜色-按压
     */
    export const focusFramePressColor = [
        0,
        1,
        1,
        1
    ];

    /**
     * 方块的边缘颜色
     */
    export const blockPaddingColor = [
        0,
        0,
        0,
        1
    ];

    /**
     * 方块主体颜色
     */
    export const blockBgColor = [
        1,
        1,
        0,
        1
    ];

    /**
     * 光源主体颜色
     */
    export const lightBgColor = [
        1,
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
        0,
        1
    ];

    /**
     * 光源区域颜色
     */
    export const lightAreaColor = [
        1,
        1,
        1,
        0.7
    ];
};

export default config;