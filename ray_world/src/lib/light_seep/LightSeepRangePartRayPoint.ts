import CuonVector3 from "../webgl/CuonVector3";

/**
 * 光点
 */
class LightSeepRangePartRayPoint {
    /**
     * 位置
     */
    public pos: CuonVector3 = new CuonVector3();
    /**
     * 强度
     */
    public power: number;

    /**
     * 加载数据
     * @param x 
     * @param y 
     * @param power 
     */
    public LoadData (
        x: number,
        y: number,
        power: number
    ) 
    {
        this.pos.elements[0] = x;
        this.pos.elements[1] = y;
        this.power = power;
    }
}

namespace LightSeepRangeRayPoint {

}

export default LightSeepRangePartRayPoint;