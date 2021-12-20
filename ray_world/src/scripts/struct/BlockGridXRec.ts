import ObjectPoolType from "../../lib/object_pool/ObjectPoolType";
import BlockGridYRec from "./BlockGridYRec";

/**
 * x 记录-方块
 */
export default class BlockGridXRec {
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
            return new BlockGridXRec();
        },
        (inst) => {

        },
        (inst) => {
            inst.yCollect.length = 0;
        }
    )
}