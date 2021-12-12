import BlockGridYRec from "./BlockGridYRec";

/**
 * x 记录
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