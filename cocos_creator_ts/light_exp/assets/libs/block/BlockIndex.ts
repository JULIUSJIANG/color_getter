import ObjectPool from "../object_pool/ObjectPool";
import ObjectRefType from "../object_ref/ObjectRefType";
import BlockRectangle from "./BlockRectangle";


/**
 * 根内容
 */
export default class BlockIndex {
    /**
     * 对象池
     */
    public pool;

    /**
     * 类型-矩形
     */
    public refRectangle: BlockRectangle.Ref;

    public constructor (
        pool: ObjectPool,
    ) 
    {
        this.pool = pool;
        this.refRectangle = new BlockRectangle.Ref(
            this,
            this.pool.GetRec(BlockRectangle.poolType)
        );
    }
}