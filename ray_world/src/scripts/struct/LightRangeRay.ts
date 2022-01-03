import CuonVector3 from "../../lib/webgl/CuonVector3";
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
    public p1 = new LightRangeRayPoint();
    /**
     * 射线终点
     */
    public p2 = new LightRangeRayPoint();
    /**
     * 自衰减速度
     */
    public lowerSpeed: number;
    /**
     * 斜率
     */
    public k: number;
    /**
     * y 偏移
     */
    public b: number;

    /**
     * 刷新缓存内容
     */
    public RefreshCache (center: CuonVector3) {
        this.p1.RefreshCache(center, this.angle);
        this.p2.RefreshCache(center, this.angle);

        if (this.p1.distance == this.p2.distance || this.p1.power == this.p2.power) {
            this.lowerSpeed = 0;
        }
        else {
            this.lowerSpeed = (this.p2.power - this.p1.power) / (this.p2.distance - this.p1.distance);
        };

        this.k = Math.tan(this.angle / 180 * Math.PI);
        this.b = center.elements[1] - this.k * center.elements[0];
    }

    /**
     * 渗透
     */
    public Pene (currDistance: number, currPower: number, container: LightRangeRayPoint) {
        // 结束的位置
        let endDistance: number;
        // 结束的强度
        let endPower: number;
        if (this.lowerSpeed == 0) {
            endDistance = this.p2.distance;
            endPower = currPower;
        }
        else {
            endDistance = currDistance + currPower / this.lowerSpeed;
            endPower = 0;
        };
        container.distance = endDistance;
        container.power = endPower;
    }
}