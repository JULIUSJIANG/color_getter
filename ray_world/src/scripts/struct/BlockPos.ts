import ObjectPoolType from "../../lib/object_pool/ObjectPoolType";

/**
 * 方块位
 */
export default class BlockPos {
    /**
     * 位置 x
     */
    public gridX: number;

    /**
     * 位置 y
     */
    public gridY: number;

    /**
     * 对象池类型
     */
    public static poolType = new ObjectPoolType(
        () => {
            return new BlockPos();
        },
        (inst) => {

        },
        (inst) => {

        }
    )
}