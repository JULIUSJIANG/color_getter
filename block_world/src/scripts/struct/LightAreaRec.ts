import LightPointRec from "./LightPointRec";

/**
 * 光照范围记录
 */
export default interface LightAreaRec {
    /**
     * 点-起始
     */
    pointFrom: LightPointRec;

    /**
     * 点-结束
     */
    pointTo: LightPointRec;
}