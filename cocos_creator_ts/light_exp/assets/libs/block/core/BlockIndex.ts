import ObjectPool from "../../object_pool/ObjectPool";
import ObjectRefType from "../../object_ref/ObjectRefType";
import BlockRectangle from "./BlockRectangle";
import BlockVis from "../visualization/BlockVisualization";


/**
 * 根内容
 */
export default class BlockIndex {
    /**
     * 对象池
     */
    public pool = new ObjectPool();

    /**
     * 可视化内容
     */
    public vis: BlockVis;

    /**
     * 类型-矩形
     */
    public refRectangle: BlockRectangle.Ref;

    public constructor (
        vis: BlockVis
    ) 
    {
        this.vis = vis;
        this.refRectangle = new BlockRectangle.Ref(
            this,
            this.pool.GetRec(BlockRectangle.poolType)
        );
    }
}