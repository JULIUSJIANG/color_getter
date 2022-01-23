import CuonVector3 from "../webgl/CuonVector3";
import LightSeepRangePartRayPoint from "./LightSeepRangePartRayPoint";

/**
 * 射线，点 1 为射线起始点，点 2 为射线终点
 */
class LightSeepRangePartRay {
    /**
     * 点 0
     */
    public p0 = new LightSeepRangePartRayPoint();
    /**
     * 点 1
     */
    public p1 = new LightSeepRangePartRayPoint();

    /**
     * 向量 p0 p1
     */
    public vecp0p1 = new CuonVector3();

    /**
     * 向量 p0 p1 的右向量
     */
    public vecp0p1Right = new CuonVector3();

    /**
     * 点 p0 与点 p1 的距离
     */
    public p0p1Distance: number;

    /**
     * p0 指向 p1 的向量的角度
     */
    public p0p1Angle: number;

    /**
     * 归一化后的向量
     */
    public vecp0p1Normalized = new CuonVector3();
    
    /**
     * 强度下降速度
     */
    public p0p1PowerLowSpeed: number = 0;

    /**
     * 加载数据
     * @param p1x 
     * @param p1y 
     * @param p1Power 
     * @param p2x 
     * @param p2y 
     * @param p2Power 
     */
    public LoadData (
        p1x: number,
        p1y: number,
        p1Power: number,
        p2x: number,
        p2y: number,
        p2Power: number
    )
    {
        this.p0.LoadData(
            p1x,
            p1y,
            p1Power
        );

        this.p1.LoadData(
            p2x,
            p2y,
            p2Power
        );

        this.vecp0p1.elements[0] = this.p1.pos.elements[0] - this.p0.pos.elements[0];
        this.vecp0p1.elements[1] = this.p1.pos.elements[1] - this.p0.pos.elements[1];

        this.vecp0p1.GetRight(this.vecp0p1Right);

        this.p0p1Distance = Math.sqrt(this.vecp0p1.elements[0] ** 2 + this.vecp0p1.elements[1] ** 2);

        this.p0p1Angle = Math.atan2(this.vecp0p1.elements[1], this.vecp0p1.elements[0]);

        this.vecp0p1.Clone(this.vecp0p1Normalized);
        this.vecp0p1Normalized.Normalize();

        if (this.p0p1Distance == 0) {
            this.p0p1PowerLowSpeed = 0;
        }
        else {
            this.p0p1PowerLowSpeed = (this.p0.power - this.p1.power) / this.p0p1Distance;
        };
    }
}

namespace LightSeepRangeRay {

}

export default LightSeepRangePartRay;