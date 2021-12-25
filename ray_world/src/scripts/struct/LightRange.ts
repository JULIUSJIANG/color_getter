import ObjectPoolType from "../../lib/object_pool/ObjectPoolType";
import CuonVector3 from "../../lib/webgl/CuonVector3";
import LightRangeRay from "./LightRangeRay";

/**
 * 光线范围
 */
export default class LightRange {
    /**
     * 圆心
     */
    public centerOfCircle = new CuonVector3();
    /**
     * 起始射线
     */
    public ray1 = new LightRangeRay();
    /**
     * 终点射线
     */
    public ray2 = new LightRangeRay();

    /**
     * 对象池类型
     */
    public static poolType = new ObjectPoolType(
        () => {
            return new LightRange();
        },
        (inst) => {

        },
        (inst) => {

        }
    )
}