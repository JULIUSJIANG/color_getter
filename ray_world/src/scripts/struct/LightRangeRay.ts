import LightRangeRayPoint from "./LightRangeRayPoint";

/**
 * 探照灯的边缘射线
 */
export default class LightRangeRay {
    /**
     * 角度
     */
    public angle: number;
    /**
     * 射线起始点
     */
    public pointFrom = new LightRangeRayPoint();
    /**
     * 射线终点
     */
    public pointTo = new LightRangeRayPoint();
}