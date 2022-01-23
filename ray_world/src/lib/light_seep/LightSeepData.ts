import CuonVector3 from "../webgl/CuonVector3";
import LightSeepDataPos from "./LightSeepDataPos";
import LightSeepDataStatus from "./LightSeepDataStatus";
import LightSeepRangePartRay from "./LightSeepRangePartRay";
import LightSeepRect from "./LightSeepRect";

/**
 * 光渗透的数据，点 1 是入射点，点 2 是出射点，点 3 是光线末点
 */
class LightSeepData {
    /**
     * 入点
     */
    pEnter: LightSeepDataPos = new LightSeepDataPos();
    /**
     * 出点
     */
    pExit: LightSeepDataPos = new LightSeepDataPos();
    /**
     * 点 0
     */
    cacheP0: LightSeepDataPos = new LightSeepDataPos();
    /**
     * 点 2
     */
    cacheP1: LightSeepDataPos = new LightSeepDataPos();
    /**
     * 点 3
     */
    cacheP2: LightSeepDataPos = new LightSeepDataPos();
    /**
     * 数据状态
     */
    status: LightSeepDataStatus;
}

namespace LightSeepData {
    /**
     * 构造渗透信息
     * @param ray 
     * @param rect 
     */
    export function Create (
        ray: LightSeepRangePartRay, 
        rect: LightSeepRect    
    ) 
    {
        // 交点集合
        let pList: CuonVector3[] = [];

        // 记录向量数据的字典
        let directionData: Map<CuonVector3, number> = new Map();

        // 获取交点
        rect.GetCrossedPoint(
            ray.vecp0p1Right,
            ray.p0.pos,
            pList,
            directionData
        );

        // 渗透数据
        let seepData = new LightSeepData();

        let dotValP0 = CuonVector3.DotByNumber(
            ray.vecp0p1Normalized.elements[0], 
            ray.vecp0p1Normalized.elements[1],

            pList[0].elements[0] - ray.p0.pos.elements[0],
            pList[0].elements[1] - ray.p0.pos.elements[1]
        );
        seepData.pEnter.rayPoint.LoadData(
            pList[0].elements[0],
            pList[0].elements[1],
            ray.p0.power - dotValP0 * ray.p0p1PowerLowSpeed
        );

        let dotValP1 = CuonVector3.DotByNumber(
            ray.vecp0p1Normalized.elements[0], 
            ray.vecp0p1Normalized.elements[1],

            pList[1].elements[0] - pList[0].elements[0],
            pList[1].elements[1] - pList[0].elements[1]
        )
        // 加载出射数据
        seepData.pExit.rayPoint.LoadData(
            pList[1].elements[0],
            pList[1].elements[1],
            seepData.pEnter.rayPoint.power - dotValP1 * (ray.p0p1PowerLowSpeed + rect.damping)
        );

        let p0x: number, p0y: number;
        // 方向矢量小于 0，说明光源正处于方块里面，入射点即为原点
        if (directionData.get(pList[0]) < 0) {
            p0x = ray.p0.pos.elements[0];
            p0y = ray.p0.pos.elements[1];
        }
        else {
            // 在光束范围内够着方块了
            if (directionData.get(pList[0]) <= ray.p0p1Distance) {
                p0x = pList[0].elements[0];
                p0y = pList[0].elements[1];
            }
            // 否则取最远点
            else {
                p0x = ray.p1.pos.elements[0];
                p0y = ray.p1.pos.elements[1];
            };
        };

        let p0power = ray.p0.power - CuonVector3.GetLen(p0x - ray.p0.pos.elements[0], p0y - ray.p0.pos.elements[1]) * ray.p0p1PowerLowSpeed;
        // 初始化点 0
        seepData.cacheP0.rayPoint.LoadData(
            p0x,
            p0y,
            p0power
        );

        let p1x: number, p1y: number, p1power: number;
        // 成功贯穿
        let through = false;

        // 在光束范围内够着方块了
        if (directionData.get(pList[0]) < ray.p0p1Distance) {
            p1x = pList[1].elements[0];
            p1y = pList[1].elements[1];
            // 获取这个点的强度
            p1power =  p0power - CuonVector3.GetLen(p1x - p0x, p1y - p0y) * (ray.p0p1PowerLowSpeed + rect.damping);
            // 此时强度已小于 0，说明实际光线在方块内出不去
            if (p1power <= 0) {
                // 进行距离回退
                p1x += p1power / (ray.p0p1PowerLowSpeed + rect.damping) * ray.vecp0p1Normalized.elements[0];
                p1y += p1power / (ray.p0p1PowerLowSpeed + rect.damping) * ray.vecp0p1Normalized.elements[1];
                p1power = 0;

                // 受限于方块以内
                seepData.status = LightSeepDataStatus.block;
            }
            else {
                through = true;

                // 成功穿透
                seepData.status = LightSeepDataStatus.through;
            };
        }
        // 没够着的话，取末点
        else {
            p1x = ray.p1.pos.elements[0];
            p1y = ray.p1.pos.elements[1];
            p1power = ray.p1.power;

            // 没够着
            seepData.status = LightSeepDataStatus.outOfReach;
        };
        // 初始化点 1
        seepData.cacheP1.rayPoint.LoadData(
            p1x,
            p1y,
            p1power
        );

        // 如果成功贯穿，计算贯穿末点
        if (through) {
            // 无阻尼，直接取 p1
            if (ray.p0p1PowerLowSpeed == 0) {
                seepData.cacheP2.rayPoint.LoadData(
                    p1x,
                    p1y,
                    p1power
                );
            }
            // 根据阻尼计算末点
            else {
                // 按照阻尼，还能移动的距离
                let dampDistance = p1power / ray.p0p1PowerLowSpeed;
                let p2x = p1x + ray.vecp0p1Normalized.elements[0] * dampDistance;
                let p2y = p1y + ray.vecp0p1Normalized.elements[1] * dampDistance;
                let distance = CuonVector3.GetLen(p2x - ray.p0.pos.elements[0], p2y - ray.p1.pos.elements[1]);
                // 衰减到超出了范围
                if (ray.p0p1Distance < distance) {
                    // 超出了的距离
                    let distanceMinus = distance - ray.p0p1Distance;
                    // 返还强度
                    let p2Power = distanceMinus * ray.p0p1PowerLowSpeed;
                    // 取光范围末点
                    seepData.cacheP2.rayPoint.LoadData(
                        ray.p1.pos.elements[0],
                        ray.p1.pos.elements[1],
                        p2Power
                    );
                }
                else {
                    // 取自然衰减到 0 的点
                    seepData.cacheP2.rayPoint.LoadData(
                        p2x,
                        p2y,
                        0
                    );
                };
            };
        }
        // 否则贯穿末点直接取 p1
        else {
            seepData.cacheP2.rayPoint.LoadData(
                p1x,
                p1y,
                p1power
            );
        };

        return seepData;
    }
}

export default LightSeepData;