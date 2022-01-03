import CuonVector3 from "../../lib/webgl/CuonVector3";

/**
 * 射线的光点
 */
export default class LightRangeRayPoint {
    /**
     * 位置
     */
    public pos = new CuonVector3();
    /**
     * 离圆心的距离
     */
    public distance: number;
    /**
     * 强度
     */
    public power: number;

    /**
     * 刷新缓存内容
     */
    public RefreshCache (center: CuonVector3, angle: number) {
        this.pos.elements[0] = center.elements[0] + Math.cos(angle / 180 * Math.PI) * this.distance;
        this.pos.elements[1] = center.elements[1] + Math.sin(angle / 180 * Math.PI) * this.distance;
    }
}