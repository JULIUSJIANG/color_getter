import BlockGridYRec from "./BlockGridYRec";

/**
 * x 记录-方块
 */
export default interface BlockGridXRec {
    /**
     * x 位置
     */
    gridX: number;

    /**
     * 这一列的记录
     */
    yCollect: BlockGridYRec[];
}