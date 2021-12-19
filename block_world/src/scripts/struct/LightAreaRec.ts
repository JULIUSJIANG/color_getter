import ObjectPoolType from "../../lib/object_pool/ObjectPoolType";
import LightPointRec from "./LightPointRec";

/**
 * 光照范围记录
 */
export default class LightAreaRec {
    /**
     * 点-起始
     */
    pointFrom: LightPointRec = new LightPointRec();

    /**
     * 点-结束
     */
    pointTo: LightPointRec = new LightPointRec();

    /**
     * 对象池类型
     */
    public static type = new ObjectPoolType(
        () => {
            return new LightAreaRec();
        },
        (inst) => {

        },
        (inst) => {

        }
    )
}