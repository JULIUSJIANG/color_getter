import CuonVector3 from "../../lib/webgl/CuonVector3";

/**
 * 射线的光点
 */
export default class LightRangeRayPoint {
    /**
     * 位置
     */
    public pixelPos = new CuonVector3();

    /**
     * 离圆心的距离
     */
    private _distance: number;

    /**
     * 离圆心的距离
     */
    public get distance (): number {
        return this._distance;
    }

    /**
     * 离圆心的距离
     */
    public set distance (value: number) {
        this._distance = value;
        if (isNaN(value)) {
            console.error(`NaN`);
        };
    }

    /**
     * 强度
     */
    private _power: number;

    /**
     * 强度
     */
    public get power (): number {
        return this._power;
    }

    /**
     * 强度
     */
    public set power (value: number) {
        this._power = value;
        if (isNaN(value)) {
            console.error(`NaN`);
        };
    }

    /**
     * 刷新缓存内容
     */
    public RefreshCache (center: CuonVector3, angle: number) {
        this.pixelPos.elements[0] = center.elements[0] + Math.cos(angle / 180 * Math.PI) * this.distance;
        this.pixelPos.elements[1] = center.elements[1] + Math.sin(angle / 180 * Math.PI) * this.distance;
    }
}