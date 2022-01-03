import ObjectPoolType from "../../lib/object_pool/ObjectPoolType";
import CuonVector3 from "../../lib/webgl/CuonVector3";

/**
 * 交点记录-射线与线段
 */
export default class InterSectionRecRayToLine {
    /**
     * 交点的像素位置
     */
    public pixelPos = new CuonVector3();
    /**
     * 距离
     */
    public distance: number;
    /**
     * 强度
     */
    public power: number;

    /**
     * 对象池类型
     */
    public static poolType = new ObjectPoolType(
        () => {
            return new InterSectionRecRayToLine();
        },
        (inst) => {

        },
        (inst) => {

        }
    )
}