import ObjectPool from "../../lib/object_pool/ObjectPool";
import ObjectPoolType from "../../lib/object_pool/ObjectPoolType";
import utilCollection from "../../lib/UtilCollection";
import utilMath from "../../lib/UtilMath";
import CuonVector3 from "../../lib/webgl/CuonVector3";
import BlockPos from "./BlockPos";
import InterSectionRecRayToLine from "./InterSectionRecRayToLine";
import LightRangeRay from "./LightRangeRay";

/**
 * 光线范围
 */
export default class LightRange {
    /**
     * 位置
     */
    public pixelPos = new CuonVector3();
    /**
     * 格子位置
     */
    public gridPos: BlockPos = new BlockPos();
    /**
     * 起始射线
     */
    public ray1 = new LightRangeRay();
    /**
     * 终点射线
     */
    public ray2 = new LightRangeRay();
    /**
     * 经过的格子位置集合
     */
    public crossedBlockMap: Map<number, Map<number, BlockPos>> = new Map();
    /**
     * 探照区域的形状
     */
    public areaShape: CuonVector3[];
    /**
     * 俩个 p1 点的距离
     */
    public distanceP1: number;
    /**
     * 俩个 p2 点的距离
     */
    public distanceP2: number;

    /**
     * 临时变量-穷举格子
     */
    private _blockWalkerList: BlockPos[] = [];
    /**
     * 临时变量-已穷举的记录
     */
    private _walkedMap: Map<number, Map<number, boolean>> = new Map();
    /**
     * 临时变量-待处理的格子列表
     */
    private _blockList: BlockPos[] = [];
    /**
     * 临时变量-距离字典
     */
    private _distanceMap: Map<BlockPos, number> = new Map();
    /**
     * 临时变量-当前探照区域
     */
    private _lightRangeList: LightRange[] = [];
    /**
     * 临时变量-新的探照区域
     */
    private _tempLightRangeList: LightRange[] = [];
    /**
     * 临时变量-渗透探照区域
     */
    private _peneLightRangeList: LightRange[] = [];
    /**
     * 临时变量-角度列表
     */
    private _angleList: number[] = [];
    /**
     * 临时变量-方块角度列表
     */
    private _blockAngleList: number[] = [];

    public constructor () {
        this.areaShape = [
            this.ray1.p1.pos,
            this.ray1.p2.pos,
            this.ray2.p2.pos,
            this.ray2.p1.pos
        ];
    }

    /**
     * 刷新缓存内容
     */
    public RefreshCache (gridSize: number, gridMap: Map<number, Map<number, boolean>>) {
        this.gridPos.gridPos.elements[0] = Math.floor(this.pixelPos.elements[0] / gridSize);
        this.gridPos.gridPos.elements[1] = Math.floor(this.pixelPos.elements[1] / gridSize);
        this.gridPos.RefreshCache(gridSize);

        this.ray1.RefreshCache(this.pixelPos);
        this.ray2.RefreshCache(this.pixelPos);

        // 先回收全部
        this.crossedBlockMap.forEach(( crossedY ) => {
            crossedY.forEach(( block ) => {
                ObjectPool.inst.Push(BlockPos.poolType, block);
            });
        });
        // 清除全部的记录
        this.crossedBlockMap.clear();
        // 先清除全部
        this._blockWalkerList.length = 0;
        this._blockWalkerList.push(this.gridPos);
        // 先清除全部
        this._walkedMap.clear();

        // 先标记为穷举过这个格子
        this._walkedMap.set(this.gridPos.gridPos.elements[0], new Map());
        this._walkedMap.get(this.gridPos.gridPos.elements[0]).set(this.gridPos.gridPos.elements[1], true);

        // 推算出联通图
        while (0 < this._blockWalkerList.length) {
            // 提取实例
            let pop = this._blockWalkerList.shift();
            // 如果是非探照区域的格子，忽略掉，甚至不会有拓展的机会
            if (!CuonVector3.CheckHasIntersection(
                this.areaShape,
                pop.areaShape
            )) 
            {
                continue;
            };
            // 这个位置确实有格子
            if (!CheckEmpty(gridMap, pop.gridPos.elements[0], pop.gridPos.elements[1])) {
                // 确保记录起来
                if (this.crossedBlockMap.has(pop.gridPos.elements[0])) {
                    this.crossedBlockMap.set(pop.gridPos.elements[0], new Map());
                };
                this.crossedBlockMap.get(pop.gridPos.elements[0]).set(pop.gridPos.elements[1], pop);
            };
            // 穷举所有相邻位置
            for (let nearI = 0; nearI < nearByOffset.length; nearI++) {
                // 读取相邻数据
                let nearData = nearByOffset[nearI];
                // 生成相邻位置
                let nearX = pop.gridPos.elements[0] + nearData[0];
                let nearY = pop.gridPos.elements[1] + nearData[1];
                // 如果已穷举过该位置，忽略
                if (this._walkedMap.has(nearX) && this._walkedMap.get(nearX).has(nearY)) {
                    // 回收
                    ObjectPool.inst.Push(BlockPos.poolType, pop);
                    continue;
                };
                // 标记为该位置已穷举过
                if (!this._walkedMap.has(nearX)) {
                    this._walkedMap.set(nearX, new Map());
                };
                this._walkedMap.get(nearX).set(nearY, true);

                // 生成记录
                let nearInst = ObjectPool.inst.Pop(BlockPos.poolType);
                nearInst.gridPos.elements[0] = nearX;
                nearInst.gridPos.elements[1] = nearY;
                nearInst.RefreshCache(gridSize);
                // 等候穷举
                this._blockWalkerList.push(nearInst);
                // 回收
                ObjectPool.inst.Push(BlockPos.poolType, pop);
            };
        };

        // 先清空
        this._blockList.length = 0;
        this._distanceMap.clear();
        // 填充进去
        this.crossedBlockMap.forEach(( blockColl ) => {
            blockColl.forEach(( block ) => {
                this._blockList.push(block);
                this._distanceMap.set(
                    block, 
                        (this.gridPos.gridPos.elements[0] - block.gridPos.elements[0]) ** 2 
                        + 
                        (this.gridPos.gridPos.elements[1] - block.gridPos.elements[1]) ** 2
                )
            });
        });

        // 排序，距离近的优先
        this._blockList.sort(( blockA, blockB ) => {
            return this._distanceMap.get(blockA) - this._distanceMap.get(blockB);
        });

        this._lightRangeList.length = 0;
        this._lightRangeList.push(this);
        this._tempLightRangeList.length = 0;
        this._peneLightRangeList.length = 0;
        // 所有格子，对光束进行影响
        for (let blockI = 0; blockI < this._blockList.length; blockI++) {
            let blockInst = this._blockList[blockI];
            this._blockAngleList.length = 0;
            
            // 用于存储受方块切割后的探照区域
            this._tempLightRangeList.length = 0;
            // 穷举当前所有的探照区域
            for (let lightI = 0; lightI < this._lightRangeList.length; lightI++) {
                let lightInst = this._lightRangeList[lightI];
                // 该光束不经过该格子，忽略
                if (!lightInst.CheckCrossed(blockInst.gridPos.elements[0], blockInst.gridPos.elements[1])) 
                {
                    // 不相干的，只存储起来
                    this._tempLightRangeList.push(lightInst);
                    continue;
                };
                // 方块 4 个点所处角度
                this._blockAngleList.length = 0;
                blockInst.areaShape.forEach(( blockPoint ) => {
                    this._blockAngleList.push(Math.atan2(blockPoint.elements[1] - lightInst.pixelPos.elements[1], blockPoint.elements[0] - lightInst.pixelPos.elements[0]));
                });
                // 只取范围以内的
                this._blockAngleList = this._blockAngleList.filter((angle) => {
                    return lightInst.ray1.angle < angle && angle < lightInst.ray2.angle;
                });
                // 去重
                this._blockAngleList = utilCollection.RemRepeatForList(this._blockAngleList);
                // 角度从小到大排序
                this._blockAngleList.sort((angleA, angleB) => {
                    return angleA - angleB;
                });
                // 清除旧内容
                this._angleList.length = 0;
                this._angleList.push(...this._blockAngleList);
                // 得到完整的角度划分
                this._angleList.unshift(lightInst.ray1.angle);
                this._angleList.push(lightInst.ray2.angle);
                // 每个角度都和前一个角度组成一个新的探照区域
                for (let i = 0; i < this._angleList.length - 1; i++) {
                    // 当前角度
                    let r1Angle = this._angleList[i];
                    // 下一角度
                    let r2Angle = this._angleList[i + 1];
                    // 生成一个新的探照区域
                    let genLightArea = ObjectPool.inst.Pop(LightRange.poolType);
                    genLightArea.pixelPos.elements[0] = lightInst.pixelPos.elements[0];
                    genLightArea.pixelPos.elements[1] = lightInst.pixelPos.elements[1];
                    lightInst.CreateRay(r1Angle, genLightArea.ray1);
                    lightInst.CreateRay(r2Angle, genLightArea.ray2);
                    // 刷新数据
                    genLightArea.RefreshCache(gridSize, gridMap);
                    this._tempLightRangeList.push(genLightArea);
                };
                // 清除渗透集合
                this._peneLightRangeList.length = 0;
                // 穷举所有划分了的光线，进行渗透处理
                for (let tempI = 0; tempI < this._tempLightRangeList.length; tempI++) {
                    // 分区实例
                    let tempLightInst = this._tempLightRangeList[tempI];
                    // 与方块无交集，直接采纳
                    if (
                        tempLightInst.ray2.angle <= this._blockAngleList[0]
                        ||
                        this._blockAngleList[this._blockAngleList.length - 1] <= tempLightInst.ray1.angle
                    )
                    {
                        this._peneLightRangeList.push(tempLightInst);
                        continue;
                    };
                    // 射线 1 的穿透数据
                    let ray1Data = blockInst.GetRayData(
                        tempLightInst.pixelPos,
                        tempLightInst.ray1
                    );
                    // 射线 2 的穿透数据
                    let ray2Data = blockInst.GetRayData(
                        tempLightInst.pixelPos,
                        tempLightInst.ray2
                    );

                    // 部分 1
                    let part1 = ObjectPool.inst.Pop(LightRange.poolType);
                    // 圆心
                    part1.pixelPos.elements[0] = tempLightInst.pixelPos.elements[0];
                    part1.pixelPos.elements[1] = tempLightInst.pixelPos.elements[1];
                    // 射线 1
                    part1.ray1.angle = tempLightInst.ray1.angle;
                    part1.ray1.p1.distance = tempLightInst.ray1.p1.distance;
                    part1.ray1.p1.power = tempLightInst.ray1.p1.power;
                    part1.ray1.p2.distance = ray1Data.crossPoint[0].distance;
                    part1.ray1.p2.power = ray1Data.crossPoint[0].power;
                    // 射线 2
                    part1.ray2.angle = tempLightInst.ray2.angle;
                    part1.ray2.p1.distance = tempLightInst.ray2.p1.distance;
                    part1.ray2.p1.power = tempLightInst.ray2.p1.power;
                    part1.ray2.p2.distance = ray2Data.crossPoint[0].distance;
                    part1.ray2.p2.power = ray2Data.crossPoint[0].power;

                    // 如果都突破不了
                    if (ray1Data.crossPoint[1].power <= 0 && ray2Data.crossPoint[1].power <= 0) {
                        let ray1Distance = ray1Data.crossPoint[0].power / (1 + tempLightInst.ray1.lowerSpeed);
                        let ray2Distance = ray2Data.crossPoint[0].power / (1 + tempLightInst.ray2.lowerSpeed);
                        // 部分 2
                        let part2 = ObjectPool.inst.Pop(LightRange.poolType);
                        // 圆心
                        part2.pixelPos.elements[0] = tempLightInst.pixelPos.elements[0];
                        part2.pixelPos.elements[1] = tempLightInst.pixelPos.elements[1];
                        // 起始射线
                        part2.ray1.angle = tempLightInst.ray1.angle;
                        part2.ray1.p1.distance = ray1Data.crossPoint[0].distance;
                        part2.ray1.p1.power = ray1Data.crossPoint[0].power;
                        part2.ray1.p2.distance = ray1Distance;
                        part2.ray1.p2.power = 0;
                        // 结束射线
                        part2.ray2.angle = tempLightInst.ray2.angle;
                        part2.ray2.p1.distance = ray2Data.crossPoint[0].distance;
                        part2.ray2.p1.power = ray2Data.crossPoint[0].power;
                        part2.ray2.p2.distance = ray2Distance;
                        part2.ray2.p2.power = 0;
                        // 刷新缓存数据
                        part2.RefreshCache(gridSize, gridMap);
                        this._peneLightRangeList.push(part2);
                        continue;
                    };

                    // 如果都突破成功
                    if (0 <= ray1Data.crossPoint[1].power && 0 <= ray2Data.crossPoint[1].power) {
                        // 部分 2
                        let part2 = ObjectPool.inst.Pop(LightRange.poolType);
                        // 圆心
                        part2.pixelPos.elements[0] = tempLightInst.pixelPos.elements[0];
                        part2.pixelPos.elements[1] = tempLightInst.pixelPos.elements[1];
                        // 起始射线
                        part2.ray1.angle = tempLightInst.ray1.angle;
                        part2.ray1.p1.distance = ray1Data.crossPoint[0].distance;
                        part2.ray1.p1.power = ray1Data.crossPoint[0].power;
                        part2.ray1.p2.distance = ray1Data.crossPoint[1].distance;
                        part2.ray1.p2.power = ray1Data.crossPoint[1].power;
                        // 结束射线
                        part2.ray2.angle = tempLightInst.ray2.angle;
                        part2.ray2.p1.distance = ray2Data.crossPoint[0].distance;
                        part2.ray2.p1.power = ray2Data.crossPoint[0].power;
                        part2.ray2.p2.distance = ray2Data.crossPoint[1].distance;
                        part2.ray2.p2.power = ray2Data.crossPoint[1].power;
                        // 刷新缓存数据
                        part2.RefreshCache(gridSize, gridMap);
                        this._peneLightRangeList.push(part2);

                        // 部分 3
                        let part3 = ObjectPool.inst.Pop(LightRange.poolType);
                        // 圆心
                        part3.pixelPos.elements[0] = tempLightInst.pixelPos.elements[0];
                        part3.pixelPos.elements[1] = tempLightInst.pixelPos.elements[1];
                        // 起始射线
                        part3.ray1.angle = tempLightInst.ray1.angle;
                        part3.ray1.p1.distance = ray1Data.crossPoint[1].distance;
                        part3.ray1.p1.power = ray1Data.crossPoint[1].power;
                        tempLightInst.ray1.Pene(ray1Data.crossPoint[1].distance, ray1Data.crossPoint[1].power, part3.ray1.p2);
                        // 结束射线
                        part3.ray2.angle = tempLightInst.ray2.angle;
                        part3.ray2.p1.distance = ray2Data.crossPoint[1].distance;
                        part3.ray2.p1.power = ray2Data.crossPoint[1].power;
                        tempLightInst.ray2.Pene(ray2Data.crossPoint[1].distance, ray2Data.crossPoint[1].power, part3.ray2.p2);
                        // 刷新缓存数据
                        part3.RefreshCache(gridSize, gridMap);
                        this._peneLightRangeList.push(part3);
                        continue;
                    };

                    // 一边突破成功，一边突破不成功，某个比率使得，射线在恰好离开方块时候消亡
                    // rate * (ray2Data.crossDistance - ray1Data.crossDistance) + ray1Data.crossDistance = rate * (ray1Data.crossPoint[1].power - ray1Data.crossPoint[0].power) + ray1Data.crossPoint[0].power;
                    // 计算恰好渗透到抵消的比率
                    let rate: number = (ray1Data.crossPoint[0].power - ray1Data.crossDistance) / ((ray2Data.crossDistance - ray1Data.crossDistance) - (ray1Data.crossPoint[1].power - ray1Data.crossPoint[0].power));
                    // 分割点 1
                    let rateP1 = [
                        (ray2Data.crossPoint[0].pixelPos.elements[0] - ray1Data.crossPoint[0].pixelPos.elements[0]) * rate + ray1Data.crossPoint[0].pixelPos.elements[0], 
                        (ray2Data.crossPoint[0].pixelPos.elements[1] - ray1Data.crossPoint[0].pixelPos.elements[1]) * rate + ray1Data.crossPoint[0].pixelPos.elements[1]
                    ];
                    // 能量 1
                    let powerP1 = (ray2Data.crossPoint[0].power - ray1Data.crossPoint[0].power) * rate + ray1Data.crossPoint[0].power;
                    // 距离 p1
                    let distanceP1 = Math.sqrt((rateP1[0] - tempLightInst.pixelPos.elements[0]) ** 2 + (rateP1[1] - tempLightInst.pixelPos.elements[1]) ** 2);

                    // 分割点 2
                    let rateP2 = [
                        (ray2Data.crossPoint[1].pixelPos.elements[0] - ray1Data.crossPoint[1].pixelPos.elements[0]) * rate + ray1Data.crossPoint[1].pixelPos.elements[0], 
                        (ray2Data.crossPoint[1].pixelPos.elements[1] - ray1Data.crossPoint[1].pixelPos.elements[1]) * rate + ray1Data.crossPoint[1].pixelPos.elements[1]
                    ];
                    // 能量 2
                    let powerP2 = (ray2Data.crossPoint[1].power - ray1Data.crossPoint[1].power) * rate + ray1Data.crossPoint[1].power;
                    // 距离 p2
                    let distanceP2 = Math.sqrt((rateP2[0] - tempLightInst.pixelPos.elements[0]) ** 2 + (rateP2[1] - tempLightInst.pixelPos.elements[1]) ** 2);

                    // 分割点 角度
                    let rateAngle = Math.atan2(rateP2[1] - tempLightInst.pixelPos.elements[1], rateP2[0] - tempLightInst.pixelPos.elements[0]) / Math.PI * 180;

                    // 如果是起始射线突出
                    if (0 < ray1Data.crossPoint[1].power) {
                        // 部分 2
                        let part2 = ObjectPool.inst.Pop(LightRange.poolType);
                        // 圆心
                        part2.pixelPos.elements[0] = tempLightInst.pixelPos.elements[0];
                        part2.pixelPos.elements[1] = tempLightInst.pixelPos.elements[1];
                        // 起始射线
                        part2.ray1.angle = tempLightInst.ray1.angle;
                        part2.ray1.p1.distance = ray1Data.crossPoint[0].distance;
                        part2.ray1.p1.power = ray1Data.crossPoint[0].power;
                        part2.ray1.p2.distance = ray1Data.crossPoint[1].distance;
                        part2.ray1.p2.distance = ray1Data.crossPoint[1].power;
                        // 结束射线
                        part2.ray2.angle = rateAngle;
                        part2.ray2.p1.distance = distanceP1;
                        part2.ray2.p1.power = powerP1;
                        part2.ray2.p2.distance = distanceP2;
                        part2.ray2.p2.power = 0;
                        // 刷新缓存
                        part2.RefreshCache(gridSize, gridMap);
                        this._peneLightRangeList.push(part2);

                        // 部分 3
                        let part3 = ObjectPool.inst.Pop(LightRange.poolType);
                        // 右方渗透距离
                        let peneDistancePart4 = ray1Data.crossPoint[1].power;
                        // 圆心
                        part3.pixelPos.elements[0] = tempLightInst.pixelPos.elements[0];
                        part3.pixelPos.elements[1] = tempLightInst.pixelPos.elements[1];
                        // 起始射线
                        part3.ray1.angle = tempLightInst.ray1.angle;
                        part3.ray1.p1.distance = ray1Data.crossPoint[1].distance;
                        part3.ray1.p1.power = ray1Data.crossPoint[1].power;
                        part3.ray1.p2.distance = ray1Data.crossPoint[1].distance + peneDistancePart4;
                        part3.ray1.p2.power = 0;
                        // 结束射线
                        part3.ray2.angle = rateAngle;
                        part3.ray2.p1.distance = distanceP2;
                        part3.ray2.p1.power = 0;
                        part3.ray2.p2.distance = distanceP2;
                        part3.ray2.p2.power = 0;
                        part3.RefreshCache(gridSize, gridMap);
                        this._peneLightRangeList.push(part3);

                        // 部分 4
                        let part4 = ObjectPool.inst.Pop(LightRange.poolType);
                        // 左方渗透距离
                        let peneDistancePart3 = ray2Data.crossPoint[0].power / (1 + this.ray2.lowerSpeed);
                        // 圆心
                        part4.pixelPos.elements[0] = tempLightInst.pixelPos.elements[0];
                        part4.pixelPos.elements[1] = tempLightInst.pixelPos.elements[1];
                        // 起始射线
                        part4.ray1.angle = rateAngle;
                        part4.ray1.p1.distance = distanceP1;
                        part4.ray1.p1.power = powerP1;
                        part4.ray1.p2.distance = distanceP2;
                        part4.ray1.p2.power = 0;
                        // 结束射线
                        part4.ray2.angle = tempLightInst.ray2.angle,
                        part4.ray2.p1.distance = ray2Data.crossPoint[0].distance;
                        part4.ray2.p1.power = ray2Data.crossPoint[0].power;
                        part4.ray2.p2.distance = ray2Data.crossPoint[0].distance + peneDistancePart3;
                        part4.ray2.p2.power = 0;
                        part4.RefreshCache(gridSize, gridMap);
                        this._peneLightRangeList.push(part4);
                        continue;
                    };

                    // 如果是结束射线突出
                    if (0 < ray2Data.crossPoint[1].power) {
                        // 部分 4
                        let part2 = ObjectPool.inst.Pop(LightRange.poolType);
                        // 左方渗透距离
                        let peneDistancePart3 = ray2Data.crossPoint[0].power / (1 + this.ray2.lowerSpeed);
                        // 圆心
                        part2.pixelPos.elements[0] = tempLightInst.pixelPos.elements[0];
                        part2.pixelPos.elements[1] = tempLightInst.pixelPos.elements[1];
                        // 起始射线
                        part2.ray1.angle = tempLightInst.ray1.angle,
                        part2.ray1.p1.distance = ray1Data.crossPoint[0].distance;
                        part2.ray1.p1.power = ray1Data.crossPoint[0].power;
                        part2.ray1.p2.distance = ray1Data.crossPoint[0].distance + peneDistancePart3;
                        part2.ray1.p2.power = 0;
                        // 结束射线
                        part2.ray2.angle = rateAngle;
                        part2.ray2.p1.distance = distanceP1;
                        part2.ray2.p1.power = powerP1;
                        part2.ray2.p2.distance = distanceP2;
                        part2.ray2.p2.power = 0;
                        part2.RefreshCache(gridSize, gridMap);
                        this._peneLightRangeList.push(part2);

                        // 部分 3
                        let part3 = ObjectPool.inst.Pop(LightRange.poolType);
                        // 圆心
                        part3.pixelPos.elements[0] = tempLightInst.pixelPos.elements[0];
                        part3.pixelPos.elements[1] = tempLightInst.pixelPos.elements[1];
                        // 起始射线
                        part3.ray1.angle = rateAngle;
                        part3.ray1.p1.distance = distanceP1;
                        part3.ray1.p1.power = powerP1;
                        part3.ray1.p2.distance = distanceP2;
                        part3.ray1.p2.power = 0;
                        // 结束射线
                        part3.ray2.angle = tempLightInst.ray2.angle;
                        part3.ray2.p1.distance = ray2Data.crossPoint[0].distance;
                        part3.ray2.p1.power = ray2Data.crossPoint[0].power;
                        part3.ray2.p2.distance = ray2Data.crossPoint[1].distance;
                        part3.ray2.p2.distance = ray2Data.crossPoint[1].power;
                        // 刷新缓存
                        part3.RefreshCache(gridSize, gridMap);
                        this._peneLightRangeList.push(part3);

                        // 部分 4
                        let part4 = ObjectPool.inst.Pop(LightRange.poolType);
                        // 右方渗透距离
                        let peneDistancePart4 = ray1Data.crossPoint[1].power;
                        // 圆心
                        part4.pixelPos.elements[0] = tempLightInst.pixelPos.elements[0];
                        part4.pixelPos.elements[1] = tempLightInst.pixelPos.elements[1];
                        // 起始射线
                        part4.ray1.angle = rateAngle;
                        part4.ray1.p1.distance = distanceP2;
                        part4.ray1.p1.power = 0;
                        part4.ray1.p2.distance = distanceP2;
                        part4.ray1.p2.power = 0;
                        // 结束射线
                        part4.ray2.angle = tempLightInst.ray1.angle;
                        part4.ray2.p1.distance = ray2Data.crossPoint[1].distance;
                        part4.ray2.p1.power = ray2Data.crossPoint[1].power;
                        part4.ray2.p2.distance = ray2Data.crossPoint[1].distance + peneDistancePart4;
                        part4.ray2.p2.power = 0;
                        part4.RefreshCache(gridSize, gridMap);
                        this._peneLightRangeList.push(part4);
                        continue;
                    };
                };
                this._lightRangeList.length =  0;
                // 更换为新的探照区域集合
                this._lightRangeList.push(...this._peneLightRangeList);
            };
        };
    }

    /**
     * 创建射线
     * @param angle 
     */
    public CreateRay (angle: number, container: LightRangeRay) {
        // r1p1
        let p1Distance = utilMath.GetDistanceAngleToLine(
            this.ray1.angle,
            this.ray1.p1.distance,
            this.ray2.angle,
            this.ray2.p1.distance,
            angle
        );
        let p1Power = utilMath.GetDistancePointToPoint(
            angle,
            p1Distance,
            this.ray1.angle,
            this.ray1.p1.distance
        )
        /
        this.distanceP1
        * (this.ray2.p1.power - this.ray1.p1.power)
        + this.ray1.p1.power;

        // r1p2
        let p2Distance = utilMath.GetDistanceAngleToLine(
            this.ray1.angle,
            this.ray1.p2.distance,
            this.ray2.angle,
            this.ray2.p2.distance,
            angle
        );
        let p2Power = utilMath.GetDistancePointToPoint(
            angle,
            p2Distance,
            this.ray1.angle,
            this.ray1.p2.distance
        )
        /
        this.distanceP2
        * (this.ray2.p2.power - this.ray1.p2.power)
        + this.ray1.p2.power;

        container.angle = angle;
        container.p1.distance = p1Distance;
        container.p1.power = p1Power;
        container.p2.distance = p2Distance;
        container.p2.power = p2Power;
    }

    /**
     * 检查是否经过某个格子
     * @param gridX 
     * @param gridY 
     * @returns 
     */
    public CheckCrossed (gridX: number, gridY: number) {
        return !CheckEmpty(this.crossedBlockMap, gridX, gridY);
    }

    /**
     * 对象池类型
     */
    public static poolType = new ObjectPoolType(
        () => {
            return new LightRange();
        },
        (inst) => {

        },
        (inst) => {

        }
    )
}

/**
 * 检查某个位置是否为空
 * @param gridMap 
 * @param gridX 
 * @param gridY 
 */
function CheckEmpty (gridMap: Map<number, Map<number, unknown>>, gridX: number, gridY: number) {
    if (!gridMap.has(gridX)) {
        return true;
    };
    if (!gridMap.get(gridX).has(gridY)) {
        return true;
    };
    return false;
}

/**
 * 相邻位置集合
 */
let nearByOffset: number[][] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
];