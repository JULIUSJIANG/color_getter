/**
 * 全局环境的配置
 */
namespace config {
    /**
     * 本地存储的时候采用的 key
     */
    export const storageKey = `data22`;

    /**
     * 背景格子的深度
     */
    export const bgGridZ = -0.2;

    /**
     * 背景 xy 轴的深度
     */
    export const xyZ = -0.1;

    /**
     * 聚焦框的深度
     */
    export const focusFrameZ = 0.1;

    /**
     * 正方形的像素尺寸
     */
    export const rectSize = 100;
        
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
        r: 1,
        g: 1,
        b: 1
    };

    /**
     * 聚焦框颜色-按压
     */
    export const focusFramePressColor = {
        r: 0,
        g: 0,
        b: 1
    };
};

export default config;