import ObjectPoolType from "../object_pool/ObjectPoolType";
import ObjectRefInst from "../object_ref/ObjectRefInst";
import ObjectRefType from "../object_ref/ObjectRefType";
import BlockIndex from "./BlockIndex";

/**
 * 块-立方体
 */
class BlockRectangle extends ObjectRefInst<BlockIndex> {
    /**
     * 设置格子位置 x
     */
    public gridX: number;
    /**
     * 设置格子位置 y
     */
    public gridY: number;

    /**
     * 上
     */
    public top: number;
    /**
     * 右
     */
    public right: number;
    /**
     * 下
     */
    public bottom: number;
    /**
     * 左
     */
    public left: number;

    /**
     * 初始化的时候
     */
    public override OnInit () {
        this.top = (this.gridY + 0.5) * this.relIndex.gridPixels;
        this.right = (this.gridX + 0.5) * this.relIndex.gridPixels;
        this.bottom = (this.gridY - 0.5) * this.relIndex.gridPixels;
        this.left = (this.gridX - 0.5) * this.relIndex.gridPixels;
    }

    /**
     * 对象池类型对象
     */ 
    public static poolType = new ObjectPoolType<BlockRectangle>(
        () => {
            return new BlockRectangle();
        },
        null,
        null
    )
}

namespace BlockRectangle {
    /**
     * 对应的引用
     */
    export class Ref extends ObjectRefType<BlockIndex, BlockRectangle> {
        public override Create (
            gridX: number,
            gridY: number
        ) 
        {
            let id = super.Create(
                (inst: BlockRectangle) => {
                    inst.gridX = gridX;
                    inst.gridY = gridY;
                }
            );
            return id;
        }
    }
}

export default BlockRectangle;