import Rectangle from "../../math/Rectangle";
import ObjectPoolType from "../../object_pool/ObjectPoolType";
import ObjectRefInst from "../../object_ref/ObjectRefInst";
import ObjectRefType from "../../object_ref/ObjectRefType";
import BlockIndex from "./BlockIndex";

/**
 * 块-立方体
 */
class BlockRectangle extends ObjectRefInst<BlockIndex> {
    /**
     * 对应的矩形
     */
    public rect = new Rectangle();

    /**
     * 对象池类型对象
     */
    public static poolType = new ObjectPoolType<BlockRectangle>(
        () => {
            return new BlockRectangle();
        }
    )
}

namespace BlockRectangle {
    /**
     * 对应的引用
     */
    export class Ref extends ObjectRefType<BlockIndex, BlockRectangle> {
        public override Create (
            x: number,
            y: number,
            w: number,
            h: number
        ) 
        {
            let id = super.Create(
                (inst: BlockRectangle) => {
                    inst.rect.pos.x = x;
                    inst.rect.pos.y = y;
                    inst.rect.w = w;
                    inst.rect.h = h;
                }
            );
            return id;
        }
    }
}

export default BlockRectangle;