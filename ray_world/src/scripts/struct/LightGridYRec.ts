import ObjectPoolType from "../../lib/object_pool/ObjectPoolType";

/**
 * y 记录
 */
export default class LightGridYRec {
    /**
     * y 位置
     */
    gridY: number;

    /**
     * 对象池类型
     */
    public static type = new ObjectPoolType(
        () => {
            return new LightGridYRec();
        },
        (inst) => {

        },
        (inst) => {

        }
    )
}