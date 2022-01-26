import utilMath from "../lib/UtilMath";
import CuonVector3 from "../lib/webgl/CuonVector3";

/**
 * 全局环境的配置
 */
namespace config {
    /**
     * 本地存储的时候采用的 key
     */
    export const storageKey = `data32`;

    /**
     * 方块尺寸
     */
    export const rectSize = 100;

    /**
     * 聚焦框的宽度
     */
    export const focusFrameBorderSize = rectSize / 10;

    /**
     * 方块边缘厚度
     */
    export const blockPadding = rectSize / 10;
    
    /**
     * 光源尺寸
     */
    export const lightSize = rectSize / 2;

    /**
     * 光源边缘厚度
     */
    export const lightPadding = rectSize / 10;

    /**
     * 最低透明度
     */
    export const lightMinAlpha = 0.1;

    /**
     * 背景颜色
     */
    export const bgColor = [
        0,
        0,
        0,
        1
    ];

    /**
     * 格子颜色
     */
    export const gridColor = [
        0.2,
        0.2,
        0.2,
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
        0.1,
        0.1,
        0.1,
        1
    ];

    /**
     * 方块主体颜色
     */
    export const blockBgColor = [
        0.1,
        0.1,
        0.1,
        1
    ];

    /**
     * 光源主体颜色
     */
    export const lightBlockBgColor = [
        0,
        0,
        0,
        1
    ];

    /**
     * 光源边缘颜色
     */
    export const lightBlockPaddingColor = [
        1,
        1,
        1,
        1
    ];

    /**
     * 光的插值区域颜色，考虑渗透
     */
    export const lightPartColor = [
        1,
        1,
        0,
        1
    ];

    /**
     * 光的范围颜色，不考虑碰撞
     */
    export const lightAreaColor = [
        1,
        0,
        1,
        1
    ];

    /**
     * 目标部分
     */
    export const targetPart = null as number;

    /**
     * r0-光照距离
     */
    export const lightR0distance = rectSize * 5;

    /**
     * r1-光照距离
     */
    export const lightR1distance = rectSize * 5;

    /**
     * 光范围
     */
    export const lightArea = [
        [0, 0]
    ];

    /**
     * r0p0 偏移
     */
    export const r0p0offset = new CuonVector3(0, 0);

    /**
     * r1p0 偏移
     */
    export const r1p0offset = new CuonVector3(0, 0);
};

config.lightArea.length = 0;
const unitCount = 8;
const unitAngle = 2 * Math.PI / unitCount;
for (let i = 0; i < unitCount; i++) {
    if (i != 0 ) {
        continue;
    };
    let curr = i * unitAngle;
    let next = (i + 1) * unitAngle;
    config.lightArea.push([curr, next]);
};

export default config;