import LightSeepData from "./LightSeepData";
import LightSeepPart from "./LightSeepPart";
import LightSeepRect from "./LightSeepRect";
import CuonVector3 from "../webgl/CuonVector3";
import root from "../../scripts/Root";
import LightSeepRangePart from "./LightSeepRangePart";
import LightSeepRangePartRay from "./LightSeepRangePartRay";

/**
 * 射线状态
 */
class LightSeepDataStatus {
    
    /**
     * 标识
     */
    public id: number;

    /**
     * 具体的解析内容
     */
    private analyse: ((range: LightSeepRangePart, rect: LightSeepRect, vertextList: LightSeepPart[], genSeepRange: LightSeepRangePart[], ray0Seep: LightSeepData, ray1Seep: LightSeepData) => void)[];

    public constructor (
        id: number,
        analyse: ((range: LightSeepRangePart, rect: LightSeepRect, vertextList: LightSeepPart[], genSeepRange: LightSeepRangePart[], ray0Seep: LightSeepData, ray1Seep: LightSeepData) => void)[]
    )
    {
        this.id = id;
        this.analyse = analyse;
        // 记录起来
        LightSeepDataStatus.instMap.set(id, this);
    }
    
    /**
     * 进行解析
     * @param range 
     * @param rect 
     * @param vertextList 
     * @param genSeepRange 
     * @param ray0Seep 
     * @param ray1Seep 
     */
    public static Analyse (
        range: LightSeepRangePart, 
        rect: LightSeepRect, 
        vertextList: LightSeepPart[], 
        genSeepRange: LightSeepRangePart[], 
        ray0Seep: LightSeepData, 
        ray1Seep: LightSeepData
    ) 
    {
        if (ray0Seep.status.id < ray1Seep.status.id) {
            range = range.Reverse();
            [ray0Seep, ray1Seep] = [ray1Seep, ray0Seep];
        };
        if (root.store.getState().logSeepData) {
            console.error(`ray0Seep.status.id[${ray0Seep.status.id}]`, ray0Seep);
            console.error(`ray1Seep.status.id[${ray1Seep.status.id}]`, ray1Seep);
        };
        ray0Seep.status.analyse[ray1Seep.status.id](
            range,
            rect,
            vertextList,
            genSeepRange,
            ray0Seep,
            ray1Seep
        );
    }
}

namespace LightSeepDataStatus {
    /**
     * 所有类型实例的记录
     */
    export const instMap: Map<number, LightSeepDataStatus> = new Map();

    /**
     * 够不着
     */
    export const outOfReach = new LightSeepDataStatus(
        0,
        [
            // 够不着
            (range: LightSeepRangePart, rect: LightSeepRect, vertextList: LightSeepPart[], genSeepRange: LightSeepRangePart[], ray0Seep: LightSeepData, ray1Seep: LightSeepData) => {
                // 俩边都够不着，没什么好处理的
                let part1 = new LightSeepPart();
                part1.vertextList[0].LoadDataByRayPoint(range.ray0.p0);
                part1.vertextList[1].LoadDataByRayPoint(range.ray0.p1);
                part1.vertextList[2].LoadDataByRayPoint(range.ray1.p1);
                part1.vertextList[2].LoadDataByRayPoint(range.ray1.p0);
                vertextList.push(part1);
            }
        ]
    );

    /**
     * 受限于方块之中
     */
    export const block = new LightSeepDataStatus (
        1,
        [
            // 够不着
            (range: LightSeepRangePart, rect: LightSeepRect, vertextList: LightSeepPart[], genSeepRange: LightSeepRangePart[], ray0Seep: LightSeepData, ray1Seep: LightSeepData) => {
                let crossedPointList = rect.GetCrossedPoint(
                    range.r0r1p1vecRight,
                    range.ray0.p1.pos
                );
                let splitedP1Pos = crossedPointList[1];
                // 比率
                let splitRate = CuonVector3.GetLen(splitedP1Pos.elements[0] - range.ray0.p1.pos.elements[0], splitedP1Pos.elements[1] - range.ray0.p1.pos.elements[1]) / range.r0r1p1vecLength;

                let splitedP0Pos = new CuonVector3();
                splitedP0Pos.elements[0] = range.r0r1p0vec.elements[0] * splitRate + range.ray0.p0.pos.elements[0];
                splitedP0Pos.elements[1] = range.r0r1p0vec.elements[1] * splitRate + range.ray0.p0.pos.elements[1];
                let splitedP0Power = (range.ray1.p0.power - range.ray0.p0.power) * splitRate + range.ray0.p0.power;

                let part1 = new LightSeepPart();
                part1.vertextList[0].LoadDataByRayPoint(range.ray0.p0);
                part1.vertextList[1].LoadDataByRayPoint(ray0Seep.cacheP0.rayPoint);
                part1.vertextList[2].LoadData(
                    splitedP1Pos.elements[0],
                    splitedP1Pos.elements[1],
                    0,
                );
                part1.vertextList[3].LoadData(
                    splitedP0Pos.elements[0],
                    splitedP0Pos.elements[1],
                    splitedP0Power,
                );
                vertextList.push(part1);

                let part2 = new LightSeepPart();
                part2.vertextList[0].Set(part1.vertextList[1]);
                part2.vertextList[1].LoadDataByRayPoint(ray0Seep.cacheP1.rayPoint);
                part2.vertextList[2].LoadData(
                    splitedP1Pos.elements[0],
                    splitedP1Pos.elements[1],
                    0
                );
                part2.vertextList[3].LoadData(
                    splitedP1Pos.elements[0],
                    splitedP1Pos.elements[1],
                    0
                );
                vertextList.push(part2);

                let part3 = new LightSeepPart();
                part3.vertextList[0].Set(part1.vertextList[3]);
                part3.vertextList[1].Set(part1.vertextList[2]);;
                part3.vertextList[2].LoadDataByRayPoint(range.ray1.p1);
                part3.vertextList[3].LoadDataByRayPoint(range.ray1.p0);
                vertextList.push(part3);
            },
            // 受限于方块之中
            (range: LightSeepRangePart, rect: LightSeepRect, vertextList: LightSeepPart[], genSeepRange: LightSeepRangePart[], ray0Seep: LightSeepData, ray1Seep: LightSeepData) => {
                let part1 = new LightSeepPart();
                part1.vertextList[0].LoadDataByRayPoint(range.ray0.p0);
                part1.vertextList[1].LoadDataByRayPoint(ray0Seep.cacheP0.rayPoint);
                part1.vertextList[2].LoadDataByRayPoint(ray1Seep.cacheP0.rayPoint);
                part1.vertextList[3].LoadDataByRayPoint(range.ray1.p0);
                vertextList.push(part1);

                let part2 = new LightSeepPart();
                part2.vertextList[0].Set(part1.vertextList[1]);
                part2.vertextList[1].LoadDataByRayPoint(ray0Seep.cacheP1.rayPoint);
                part2.vertextList[2].LoadDataByRayPoint(ray1Seep.cacheP1.rayPoint);
                part2.vertextList[3].Set(part1.vertextList[2]);
                vertextList.push(part2);
            }
        ]
    );

    /**
     * 成功穿透
     */
    export const through = new LightSeepDataStatus(
        2,
        [
            // 够不着
            (range: LightSeepRangePart, rect: LightSeepRect, vertextList: LightSeepPart[], genSeepRange: LightSeepRangePart[], ray0Seep: LightSeepData, ray1Seep: LightSeepData) => {
                let cross = rect.GetCrossedPoint(
                    range.r0r1p1vecRight,
                    range.ray0.p1.pos,
                );
                let posP = cross[1];
                let rateP = CuonVector3.GetLen(posP.elements[0] - range.ray0.p1.pos.elements[0], posP.elements[1] - range.ray0.p1.pos.elements[1]) / range.r0r1p1vecLength;
                let splitedP1X = posP.elements[0];
                let splitedP1Y = posP.elements[1];
                let splitedP1Power = 0;

                let splitedP0X = (range.ray1.p0.pos.elements[0] - range.ray0.p0.pos.elements[0]) * rateP + range.ray0.p0.pos.elements[0];
                let splitedP0Y = (range.ray1.p0.pos.elements[1] - range.ray0.p0.pos.elements[1]) * rateP + range.ray0.p0.pos.elements[1];
                let splitedP0Power = (range.ray1.p0.power - range.ray0.p0.power) * rateP + range.ray0.p0.power;

                let pos = cross[0];
                let posRate = CuonVector3.GetLen(pos.elements[0] - range.ray0.p1.pos.elements[0], pos.elements[1] - range.ray0.p1.pos.elements[1]) / range.r0r1p1vecLength;
                let seepRay = new LightSeepRangePartRay();
                seepRay.LoadData(
                    (range.ray1.p0.pos.elements[0] - range.ray0.p0.pos.elements[0]) * posRate + range.ray0.p0.pos.elements[0],
                    (range.ray1.p0.pos.elements[1] - range.ray0.p0.pos.elements[1]) * posRate + range.ray0.p0.pos.elements[1],
                    (range.ray1.p0.power - range.ray0.p0.power) * posRate + range.ray0.p0.power,

                    (range.ray1.p1.pos.elements[0] - range.ray0.p1.pos.elements[0]) * posRate + range.ray0.p1.pos.elements[0],
                    (range.ray1.p1.pos.elements[1] - range.ray0.p1.pos.elements[1]) * posRate + range.ray0.p1.pos.elements[1],
                    (range.ray1.p1.power - range.ray0.p1.power) * posRate + range.ray0.p1.power
                );
                let seepData = LightSeepData.Create(
                    seepRay,
                    rect
                );
                let zeroRate = ray0Seep.cacheP1.rayPoint.power / (ray0Seep.cacheP1.rayPoint.power - seepData.cacheP1.rayPoint.power);
                let zeroPosX = (seepData.pExit.rayPoint.pos.elements[0] - ray0Seep.cacheP1.rayPoint.pos.elements[0]) * zeroRate + ray0Seep.cacheP1.rayPoint.pos.elements[0];
                let zeroPosY = (seepData.pExit.rayPoint.pos.elements[1] - ray0Seep.cacheP1.rayPoint.pos.elements[1]) * zeroRate + ray0Seep.cacheP1.rayPoint.pos.elements[1];
                let zeroPosPower = (seepData.cacheP1.rayPoint.power - ray0Seep.cacheP1.rayPoint.power) * zeroRate + ray0Seep.cacheP1.rayPoint.power;
                let part1 = new LightSeepPart();
                part1.vertextList[0].LoadDataByRayPoint(range.ray0.p0);
                part1.vertextList[1].LoadDataByRayPoint(ray0Seep.cacheP0.rayPoint);
                part1.vertextList[2].LoadData(
                    splitedP1X,
                    splitedP1Y,
                    splitedP1Power
                );
                part1.vertextList[3].LoadData(
                    splitedP0X,
                    splitedP0Y,
                    splitedP0Power
                );
                vertextList.push(part1);

                let part2 = new LightSeepPart();
                part2.vertextList[0].Set(part1.vertextList[1]);
                part2.vertextList[1].LoadDataByRayPoint(ray0Seep.cacheP1.rayPoint);
                part2.vertextList[2].LoadData(
                    zeroPosX,
                    zeroPosY,
                    zeroPosPower
                );
                part2.vertextList[3].Set(part1.vertextList[2]);
                vertextList.push(part2);

                let part3 = new LightSeepPart();
                part3.vertextList[0].Set(part1.vertextList[3]);
                part3.vertextList[1].Set(part1.vertextList[2]);
                part3.vertextList[2].LoadDataByRayPoint(range.ray1.p1);
                part3.vertextList[3].LoadDataByRayPoint(range.ray1.p0);
                vertextList.push(part3);

                let genRange = new LightSeepRangePart();
                genRange.LoadData(
                    ray0Seep.cacheP1.rayPoint.pos.elements[0],
                    ray0Seep.cacheP1.rayPoint.pos.elements[1],
                    ray0Seep.cacheP1.rayPoint.power,

                    ray0Seep.cacheP2.rayPoint.pos.elements[0],
                    ray0Seep.cacheP2.rayPoint.pos.elements[1],
                    ray0Seep.cacheP2.rayPoint.power,

                    part2.vertextList[2].pos.elements[0],
                    part2.vertextList[2].pos.elements[1],
                    part2.vertextList[2].power,

                    part2.vertextList[2].pos.elements[0],
                    part2.vertextList[2].pos.elements[1],
                    part2.vertextList[2].power,
                );
                genSeepRange.push(genRange);
            },
            // 受限于方块之中
            (range: LightSeepRangePart, rect: LightSeepRect, vertextList: LightSeepPart[], genSeepRange: LightSeepRangePart[], ray0Seep: LightSeepData, ray1Seep: LightSeepData) => {
                let rate = ray0Seep.pExit.rayPoint.power / (ray0Seep.pExit.rayPoint.power - ray1Seep.pExit.rayPoint.power);
                let splitedP1X = (ray1Seep.pExit.rayPoint.pos.elements[0] - ray0Seep.pExit.rayPoint.pos.elements[0]) * rate + ray0Seep.pExit.rayPoint.pos.elements[0];
                let splitedP1Y = (ray1Seep.pExit.rayPoint.pos.elements[1] - ray0Seep.pExit.rayPoint.pos.elements[1]) * rate + ray0Seep.pExit.rayPoint.pos.elements[1];
                let splitedP1Power = (ray1Seep.pExit.rayPoint.power - ray0Seep.pExit.rayPoint.power) * rate + ray0Seep.pExit.rayPoint.power;

                let splitedP0X = (ray1Seep.cacheP0.rayPoint.pos.elements[0] - ray0Seep.cacheP0.rayPoint.pos.elements[0]) * rate + ray0Seep.cacheP0.rayPoint.pos.elements[0];
                let splitedP0Y = (ray1Seep.cacheP0.rayPoint.pos.elements[1] - ray0Seep.cacheP0.rayPoint.pos.elements[1]) * rate + ray0Seep.cacheP0.rayPoint.pos.elements[1];
                let splitedP0Power = (ray1Seep.cacheP0.rayPoint.power - ray0Seep.cacheP0.rayPoint.power) * rate + ray0Seep.cacheP0.rayPoint.power;

                let part1 = new LightSeepPart();
                part1.vertextList[0].LoadDataByRayPoint(range.ray0.p0);
                part1.vertextList[1].LoadDataByRayPoint(ray0Seep.cacheP0.rayPoint);
                part1.vertextList[2].LoadDataByRayPoint(ray1Seep.cacheP0.rayPoint);
                part1.vertextList[3].LoadDataByRayPoint(range.ray1.p0);
                vertextList.push(part1);

                let part2 = new LightSeepPart();
                part2.vertextList[0].Set(part1.vertextList[1]);
                part2.vertextList[1].LoadDataByRayPoint(ray0Seep.cacheP1.rayPoint);
                part2.vertextList[2].LoadData(
                    splitedP1X,
                    splitedP1Y,
                    splitedP1Power
                );
                part2.vertextList[3].LoadData(
                    splitedP0X,
                    splitedP0Y,
                    splitedP0Power
                );
                vertextList.push(part2);

                let part3 = new LightSeepPart();
                part3.vertextList[0].Set(part2.vertextList[3]);
                part3.vertextList[1].Set(part2.vertextList[2]);
                part3.vertextList[2].LoadDataByRayPoint(ray1Seep.cacheP1.rayPoint);
                part3.vertextList[3].LoadDataByRayPoint(ray1Seep.cacheP0.rayPoint);
                vertextList.push(part3);
                
                let genRange = new LightSeepRangePart();
                genRange.LoadData(
                    part2.vertextList[1].pos.elements[0],
                    part2.vertextList[1].pos.elements[1],
                    part2.vertextList[1].power,

                    ray0Seep.cacheP2.rayPoint.pos.elements[0],
                    ray0Seep.cacheP2.rayPoint.pos.elements[1],
                    ray0Seep.cacheP2.rayPoint.power,

                    part2.vertextList[2].pos.elements[0],
                    part2.vertextList[2].pos.elements[1],
                    part2.vertextList[2].power,

                    part2.vertextList[2].pos.elements[0],
                    part2.vertextList[2].pos.elements[1],
                    part2.vertextList[2].power,
                );
                genSeepRange.push(genRange);
            },
            // 成功穿透
            (range: LightSeepRangePart, rect: LightSeepRect, vertextList: LightSeepPart[], genSeepRange: LightSeepRangePart[], ray0Seep: LightSeepData, ray1Seep: LightSeepData) => {
                let part1 = new LightSeepPart();
                part1.vertextList[0].LoadDataByRayPoint(range.ray0.p0);
                part1.vertextList[1].LoadDataByRayPoint(ray0Seep.cacheP0.rayPoint);
                part1.vertextList[2].LoadDataByRayPoint(ray1Seep.cacheP0.rayPoint);
                part1.vertextList[3].LoadDataByRayPoint(range.ray1.p0);
                vertextList.push(part1);

                let part2 = new LightSeepPart();
                part2.vertextList[0].Set(part1.vertextList[1]);
                part2.vertextList[1].LoadDataByRayPoint(ray0Seep.cacheP1.rayPoint);
                part2.vertextList[2].LoadDataByRayPoint(ray1Seep.cacheP1.rayPoint);
                part2.vertextList[3].Set(part1.vertextList[2]);
                vertextList.push(part2);

                let genRange = new LightSeepRangePart();
                genRange.LoadData(
                    part2.vertextList[1].pos.elements[0],
                    part2.vertextList[1].pos.elements[1],
                    part2.vertextList[1].power,

                    ray0Seep.cacheP2.rayPoint.pos.elements[0],
                    ray0Seep.cacheP2.rayPoint.pos.elements[1],
                    ray0Seep.cacheP2.rayPoint.power,

                    part2.vertextList[2].pos.elements[0],
                    part2.vertextList[2].pos.elements[1],
                    part2.vertextList[2].power,

                    ray1Seep.cacheP2.rayPoint.pos.elements[0],
                    ray1Seep.cacheP2.rayPoint.pos.elements[1],
                    ray1Seep.cacheP2.rayPoint.power
                );
                genSeepRange.push(genRange);
            }
        ]
    );
}
export default LightSeepDataStatus;