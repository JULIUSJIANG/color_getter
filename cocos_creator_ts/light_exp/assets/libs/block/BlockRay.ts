import ObjectPoolType from "../object_pool/ObjectPoolType";
import ObjectRefInst from "../object_ref/ObjectRefInst";
import ObjectRefType from "../object_ref/ObjectRefType";
import BlockIndex from "./BlockIndex";

/**
 * 块-射线
 */
class BlockRay extends ObjectRefInst<BlockIndex> {
    /**
     * 位置
     */
    public pos = new cc.Vec2();
    /**
     * 方向以及强度
     */
    public vec = new cc.Vec2();

    /**
     * 重新填充数据
     * @param inst 
     * @param posX 
     * @param posY 
     * @param vecX 
     * @param vecY 
     */
    public static ReFill (
        inst: BlockRay,
        posX: number,
        posY: number,
        vecX: number,
        vecY: number
    )
    {
        inst.pos.x = posX;
        inst.pos.y = posY;
        inst.vec.x = vecX;
        inst.vec.y = vecY;
    }

    /**
     * 对象池类型对象
     */
    public static poolType = new ObjectPoolType<BlockRay>(
        () => {
            return new BlockRay();
        },
        null,
        null
    )
}

namespace BlockRay {
    /**
     * 对应的引用
     */
    export class Ref extends ObjectRefType<BlockIndex, BlockRay> {

    }
}

export default BlockRay;