import BlockGridYRec from "./BlockGridYRec";

/**
 * x 记录-光源
 */
export default interface LightGridXRec {
    /**
     * x 位置
     */
    gridX: number;

    /**
     * 这一列的记录
     */
    yCollect: BlockGridYRec[];
}