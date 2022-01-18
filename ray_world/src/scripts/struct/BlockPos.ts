import ObjectPool from "../../lib/object_pool/ObjectPool";
import ObjectPoolType from "../../lib/object_pool/ObjectPoolType";
import utilCollection from "../../lib/UtilCollection";
import CuonVector3 from "../../lib/webgl/CuonVector3";
import InterSectionRecRayToBlock from "./InterSectionRecRayToBlock";
import InterSectionRecRayToLine from "./InterSectionRecRayToLine";

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
     * 获取角度列表
     * @param pixelPos 
     * @param area1 
     * @param area2 
     */
    public GetAngleList (pixelPos: CuonVector3, area1: number, area2: number) {
        // 方块 4 个点所处角度
        let angleList: number[] = [];
        this.areaShape.forEach(( blockPoint ) => {
            angleList.push(Math.atan2(blockPoint.elements[1] - pixelPos.elements[1], blockPoint.elements[0] - pixelPos.elements[0]) / Math.PI * 180);
        });
        // 只取范围以内的
        angleList = angleList.filter((angle) => {
            return area1 < angle && angle < area2;
        });
        // 去重
        angleList = utilCollection.RemRepeatForList(angleList);
        // 角度从小到大排序
        angleList.sort((angleA, angleB) => {
            return angleA - angleB;
        });
        return angleList;
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