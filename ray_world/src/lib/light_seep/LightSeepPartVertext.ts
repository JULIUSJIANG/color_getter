import CuonVector3 from "../webgl/CuonVector3";
import LightSeepRangeRayPoint from "./LightSeepRangeRayPoint";

/**
 * 顶点数据
 */
class LightSeepPartVertext {
    /**
     * 位置
     */
    public pos = new CuonVector3();
    /**
     * 强度
     */
    public power: number = 0;

    /**
     * 载入数据
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

    /**
     * 通过射线点加载数据
     * @param rayPoint 
     */
    public LoadDataByRayPoint (
        rayPoint: LightSeepRangeRayPoint
    )
    {
        this.LoadData(
            rayPoint.pos.elements[0],
            rayPoint.pos.elements[1],
            rayPoint.power
        );
    }

    /**
     * 设置实质的内容
     * @param data 
     */
    public Set (data: LightSeepPartVertext) {
        this.LoadData(
            data.pos.elements[0],
            data.pos.elements[1],
            data.power
        );
    }
}

namespace LightSeepVertext {

}

export default LightSeepPartVertext;