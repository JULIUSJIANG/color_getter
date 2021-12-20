import ObjectPoolType from "../../lib/object_pool/ObjectPoolType";

/**
 * 光照关键点记录
 */
export default class LightPointRec {
    /**
     * 角度
     */
    angle: number;
    /**
     * 距离
     */
    distance: number;
    
    /**
     * 对象池类型
     */
    public static type = new ObjectPoolType(
        () => {
            return new LightPointRec();
        },
        (inst) => {

        },
        (inst) => {

        }
    )
}