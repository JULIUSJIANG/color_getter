import ObjectPool from "../object_pool/ObjectPool";
import ObjectRefType from "../object_ref/ObjectRefType";
import BlockRay from "./BlockRay";
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

    /**
     * 类型-射线
     */
    public refRay: BlockRay.Ref;

    /**
     * 每个格子的像素宽度
     */
    public gridPixels: number;

    public constructor (
        pool: ObjectPool,
        gridPixels: number
    ) 
    {
        this.pool = pool;
        this.gridPixels = gridPixels;
        this.refRectangle = new BlockRectangle.Ref(
            this,
            this.pool.GetRec(BlockRectangle.poolType)
        );
        this.refRay = new BlockRay.Ref(
            this,
            this.pool.GetRec(BlockRay.poolType)
        )
    }
}