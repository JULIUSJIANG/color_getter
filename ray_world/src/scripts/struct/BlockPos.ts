import ObjectPool from "../../lib/object_pool/ObjectPool";
import ObjectPoolType from "../../lib/object_pool/ObjectPoolType";
import CuonVector3 from "../../lib/webgl/CuonVector3";
import InterSectionRecRayToBlock from "./InterSectionRecRayToBlock";
import InterSectionRecRayToLine from "./InterSectionRecRayToLine";
import LightRangeRay from "./LightRangeRay";

/**
 * 方块位
 */
export default class BlockPos {
    /**
     * 格子位置
     */
    public gridPos = new CuonVector3();

    /**
     * 左
     */
    public pixelLeft: number;
    /**
     * 右
     */
    public pixelRight: number;
    /**
     * 下
     */
    public pixelBottom: number;
    /**
     * 上
     */
    public pixelTop: number;

    /**
     * 左下
     */
    public pixelLB = new CuonVector3();
    /**
     * 右下
     */
    public pixelRB = new CuonVector3();
    /**
     * 右上
     */
    public pixelRT = new CuonVector3();
    /**
     * 左上
     */
    public pixelLT = new CuonVector3();

    /**
     * 区域形状
     */
    public areaShape: CuonVector3[];

    public constructor () {
        this.areaShape = [
            this.pixelLB,
            this.pixelRB,
            this.pixelRT,
            this.pixelLT
        ];
    }

    /**
     * 刷新缓存数据
     */
    public RefreshCache (gridSize: number) {
        this.pixelLeft = this.gridPos.elements[0] * gridSize;
        this.pixelRight = (this.gridPos.elements[0] + 1) * gridSize;
        this.pixelBottom = this.gridPos.elements[1] * gridSize;
        this.pixelTop = (this.gridPos.elements[1] + 1) * gridSize;

        this.pixelLB.elements[0] = this.pixelLeft;
        this.pixelLB.elements[1] = this.pixelBottom;

        this.pixelRB.elements[0] = this.pixelRight;
        this.pixelRB.elements[1] = this.pixelBottom;

        this.pixelRT.elements[0] = this.pixelRight;
        this.pixelRT.elements[1] = this.pixelTop;

        this.pixelLT.elements[0] = this.pixelLeft;
        this.pixelLT.elements[1] = this.pixelTop;
    }

    /**
     * 获取射线的穿透数据
     * @param centerPos 
     * @param ray 
     */
    public GetRayData (centerPos: CuonVector3, ray: LightRangeRay): InterSectionRecRayToBlock {
        // r1 的 4 个交点
        let points = [
            ObjectPool.inst.Pop(InterSectionRecRayToLine.poolType),
            ObjectPool.inst.Pop(InterSectionRecRayToLine.poolType),
            ObjectPool.inst.Pop(InterSectionRecRayToLine.poolType),
            ObjectPool.inst.Pop(InterSectionRecRayToLine.poolType)
        ];
        points[0].pixelPos.elements[0] = this.pixelLeft;
        points[0].pixelPos.elements[1] = ray.k * this.pixelLeft + ray.b;

        points[1].pixelPos.elements[0] = this.pixelRight;
        points[1].pixelPos.elements[1] = ray.k * this.pixelRight + ray.b;

        points[2].pixelPos.elements[0] = (this.pixelBottom - ray.b) / ray.k;
        points[2].pixelPos.elements[1] = this.pixelBottom;

        points[3].pixelPos.elements[0] = (this.pixelTop - ray.b) / ray.k;
        points[3].pixelPos.elements[1] = this.pixelTop;

        // 初始化缓存的数据
        points.forEach(( point ) => {
            point.distance = Math.sqrt((point.pixelPos.elements[0] - centerPos.elements[0])**2 + (point.pixelPos.elements[1] - centerPos.elements[1])**2);
            point.power = (point.distance - ray.p1.distance) * ray.lowerSpeed + ray.p1.power;
        });

        // 排序-就近优先
        points.sort((p1, p2) => {
            return p1.distance - p2.distance;
        });

        // 移除多余点
        points.splice(0, 1);
        points.splice(points.length - 1, 1);

        // 得到穿透厚度
        let crossDistance = points[1].distance - points[0].distance;

        return {
            crossPoint: points,
            crossDistance: crossDistance
        };
    }

    /**
     * 对象池类型
     */
    public static poolType = new ObjectPoolType(
        () => {
            return new BlockPos();
        },
        (inst) => {

        },
        (inst) => {

        }
    )
}