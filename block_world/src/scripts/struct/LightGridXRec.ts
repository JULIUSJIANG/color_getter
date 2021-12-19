import ObjectPoolType from "../../lib/object_pool/ObjectPoolType";
import BlockGridYRec from "./BlockGridYRec";

/**
 * x 记录-光源
 */
export default class LightGridXRec {
    /**
     * x 位置
     */
    gridX: number;

    /**
     * 这一列的记录
     */
    yCollect: BlockGridYRec[] = [];

    /**
     * 对象池类型
     */
    public static type = new ObjectPoolType(
        () => {
            return new LightGridXRec();
        },
        (inst) => {

        },
        (inst) => {
            inst.yCollect.length = 0;
        }
    )
}