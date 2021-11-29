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
        );
    }

    /**
     * 获取对应的格子位置
     * @param x 
     * @returns 
     */
    public GetGridLoc (x: number) {
        return Math.floor( x / this.gridPixels + 0.5 );
    }

    public GetHorGridHit (pos: cc.Vec2, direction: cc.Vec2) {
        let gridLocX = this.GetGridLoc(pos.x);
        let rateRight = ((gridLocX + 0.5) * this.gridPixels - pos.x) / direction.x;
        let rateLeft = ((gridLocX - 0.5) * this.gridPixels - pos.x) / direction.x;
        return 0 < rateRight ? rateRight : rateLeft;
    }

    public GetHorGridHitRev (pos: cc.Vec2, direction: cc.Vec2) {
        let gridLocX = this.GetGridLoc(pos.x);
        let rateRight = ((gridLocX + 0.5) * this.gridPixels - pos.x) / direction.x;
        let rateLeft = ((gridLocX - 0.5) * this.gridPixels - pos.x) / direction.x;
        return 0 < rateRight ? rateLeft : rateRight;
    }

    public GetVerGridHit (pos: cc.Vec2, direction: cc.Vec2) {
        let gridLocY = this.GetGridLoc(pos.y);
        let rateTop = ((gridLocY + 0.5) * this.gridPixels - pos.y) / direction.y;
        let rateBottom = ((gridLocY - 0.5) * this.gridPixels - pos.y) / direction.y;
        return 0 < rateTop ? rateTop : rateBottom;
    }

    public GetVerGridHitRev (pos: cc.Vec2, direction: cc.Vec2) {
        let gridLocY = this.GetGridLoc(pos.y);
        let rateTop = ((gridLocY + 0.5) * this.gridPixels - pos.y) / direction.y;
        let rateBottom = ((gridLocY - 0.5) * this.gridPixels - pos.y) / direction.y;
        return 0 < rateTop ? rateBottom : rateTop;
    }
}