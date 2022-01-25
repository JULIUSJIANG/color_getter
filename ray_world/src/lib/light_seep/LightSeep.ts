import CuonVector3 from "../webgl/CuonVector3";
import LightSeepData from "./LightSeepData";
import LightSeepPart from "./LightSeepPart";
import LightSeepRangePart from "./LightSeepRangePart";
import LightSeepRect from "./LightSeepRect";
import LightSeepDataStatus from "./LightSeepDataStatus";
import LightSeepRange from "./LightSeepRange";

/**
 * 渗透型光照模型
 */
namespace lightSeep {
    /**
     * 获取渗透的顶点数据
     * @param range 
     * @param rectList 
     * @param vertextList 
     */
    export function GetVertext (
        range: LightSeepRange,
        rectList: LightSeepRect[],
        vertextList: LightSeepPart[]
    )
    {
        // 先进行排序，越近的越早发生影响
        SortByDistance(
            range.mainDirection,
            rectList
        );
        // 提取每个部分的渗透数据
        for (let partIndex = 0; partIndex < range.partList.length; partIndex++) {
            let part = range.partList[partIndex];
            GetVertexForRectList(
                part,
                rectList,
                0,
                vertextList
            );
        };
    }

    /**
     * 获取当前索引以及以后的方块影响下的探照数据
     * @param range 
     * @param rectList 
     * @param rectIndex 
     * @param vertextList 
     * @returns 
     */
    function GetVertexForRectList (
        range: LightSeepRangePart,
        rectList: LightSeepRect[],
        rectIndex: number,
        vertextList: LightSeepPart[],
    )
    {
        // 没有更多的方块产生影响了
        if (rectList.length <= rectIndex) {
            let part = new LightSeepPart();
            part.vertextList[0].LoadDataByRayPoint(range.ray0.p0);
            part.vertextList[1].LoadDataByRayPoint(range.ray0.p1);
            part.vertextList[2].LoadDataByRayPoint(range.ray1.p1);
            part.vertextList[3].LoadDataByRayPoint(range.ray1.p0);
            vertextList.push(part);
            return;
        };
        // 当前矩形
        let currRect = rectList[rectIndex];
        // 切割后的子探照区域
        let splited: LightSeepRangePart[] = [];

        // 先用方块切割光束
        SplitLightRange(
            range,
            rectList[rectIndex],
            splited
        );

        // 渗透后的子光束
        let genSeepRange: LightSeepRangePart[] = [];
        // 每个子探照区域都对数据进行填充
        splited.forEach((subRange, index) => {
            // 用每个切割后的光束填充数据
            GetVertexForRectOnce(
                subRange,
                currRect,
                vertextList,
                genSeepRange
            );
        });
        // 渗透后的子光束继续被下一个方块影响
        genSeepRange.forEach(( genRange ) => {
            GetVertexForRectList(
                genRange,
                rectList,
                rectIndex + 1,
                vertextList
            );
        });
    }

    /**
     * 当前光束与方块对最终数据的填充
     * @param range 
     * @param rect 
     * @param vertextList 
     * @param genSeepRange 
     */
    function GetVertexForRectOnce (
        range: LightSeepRangePart,
        rect: LightSeepRect,
        vertextList: LightSeepPart[],
        genSeepRange: LightSeepRangePart[]
    )
    {
        let hasIns = CuonVector3.CheckHasIntersection(range.pList, rect.pList);
        // 该探照区域与该方块无交集
        if (!hasIns) {
            genSeepRange.push(range.Clone());
            return;
        };
        // 射线 0 的渗透数据
        let ray0Seep = LightSeepData.Create(
            range.ray0,
            rect
        );
        // 射线 1 的渗透数据
        let ray1Seep = LightSeepData.Create(
            range.ray1,
            rect
        );
        // 进行数据记录
        LightSeepDataStatus.Analyse(
            range,
            rect,
            vertextList,
            genSeepRange,
            ray0Seep,
            ray1Seep
        );
    }

    /**
     * 根据矩形关键点分割光束
     * @param range 
     * @param rect 
     * @param itemList 
     */
    export function SplitLightRange (range: LightSeepRangePart, rect: LightSeepRect, itemList: LightSeepRangePart[]) {
        if (range.r0r1p0vecLength == 0) {
            SplitLightRangeByAngle(
                range,
                rect,
                itemList
            );
        }
        else {
            SplitLightRangeByP1(
                range,
                rect,
                itemList
            );
        };
    }

    /**
     * 射线记录
     */
    class RayRec {
        /**
         * 点 1 x
         */
         p1x: number;
         /**
          * 点 1 y
          */
         p1y: number;
 
         /**
          * 点 1 强度
          */
         p1Power: number;
 
         /**
          * 点 2 x
          */
         p2x: number;
         /**
          * 点 2 y
          */
         p2y: number;
 
         /**
          * 点 2 强度
          */
         p2Power: number;

         public constructor (
            p1x: number,
            p1y: number,
            p1Power: number,
            p2x: number,
            p2y: number,
            p2Power: number
         )
         {
            this.p1x = p1x;
            this.p1y = p1y;
            this.p1Power = p1Power;
            this.p2x = p2x;
            this.p2y = p2y;
            this.p2Power = p2Power;
         }
    }

    /**
     * 权重记录
     */
    class WeightRec {
        /**
         * 权重
         */
        weight: number;
        /**
         * 射线数据
         */
        rec: RayRec;

        public constructor (
            angle: number,
            rec: RayRec
        )
        {
            this.weight = angle;
            this.rec = rec;
        }
    }

    /**
     * 按角度分割
     * @param range 
     * @param rect 
     * @param itemList 
     */
    function SplitLightRangeByAngle (range: LightSeepRangePart, rect: LightSeepRect, itemList: LightSeepRangePart[]) {
        let weightList: WeightRec[] = [];
        for (let pIndex = 0; pIndex < rect.pList.length; pIndex++) {
            let p1 = rect.pList[pIndex];
            let p0 = new CuonVector3();
            range.GetPenetratePos(
                p1,
                p0
            );
            // 角度
            let angle = Math.atan2(p1.elements[1] - p0.elements[1], p1.elements[0] - p0.elements[0]);
            // 角度超出，忽略
            if (angle <= range.ray0.p0p1Angle) {
                continue;
            };
            if (range.ray1.p0p1Angle <= angle) {
                continue;
            };
            AddWeightRec(
                range,
                p0,
                p1,
                weightList,
                angle
            );
        };
        CreateLightRange(
            range,
            weightList,
            itemList
        );
    }

    /**
     * 按 p1 分割
     * @param range 
     * @param rect 
     * @param itemList 
     */
    function SplitLightRangeByP1 (range: LightSeepRangePart, rect: LightSeepRect, itemList: LightSeepRangePart[]) {
        let weightList: WeightRec[] = [];
        let maxDistance = range.r0r1p0vecLength ** 2;
        for (let pIndex = 0; pIndex < rect.pList.length; pIndex++) {
            let p1 = rect.pList[pIndex];
            let p0 = new CuonVector3();
            range.GetPenetratePos(
                p1,
                p0
            );
            let distance = (p0.elements[0] - range.ray0.p0.pos.elements[0]) * range.r0r1p0vec.elements[0] + (p0.elements[1] - range.ray0.p0.pos.elements[1]) * range.r0r1p0vec.elements[1];
            if (distance <= 0) {
                continue;
            };
            if (maxDistance <= distance) {
                continue;
            };
            AddWeightRec(
                range,
                p0,
                p1,
                weightList,
                distance
            );
        };
        CreateLightRange(
            range,
            weightList,
            itemList
        );
    }

    /**
     * 添加权重记录
     * @param range 
     * @param p1 
     * @param p2 
     * @param angleRecList 
     * @param weight 
     */
    function AddWeightRec (
        range: LightSeepRangePart,
        p1: CuonVector3,
        p2: CuonVector3,
        angleRecList: WeightRec[],
        weight: number
    )
    {
        let p1p2 = new CuonVector3();
        p1p2.elements[0] = p2.elements[0] - p1.elements[0];
        p1p2.elements[1] = p2.elements[1] - p1.elements[1];
        let p1p2Right = new CuonVector3();
        p1p2.GetRight(p1p2Right);
        let insert = new CuonVector3();
        CuonVector3.GetIntersection(
            p1p2Right,
            p1,
            range.r0r1p1vecRight,
            range.ray0.p1.pos,
            insert
        );
        angleRecList.push(new WeightRec(
            weight,
            new RayRec (
                p1.elements[0],
                p1.elements[1],
                range.ray0.p0.power,
                insert.elements[0],
                insert.elements[1],
                CuonVector3.Dot(insert, range.ray0.p1.pos) / range.r0r1p1vecLength * (range.ray1.p1.power - range.ray0.p1.power) + range.ray0.p1.power
            )
        ));
    }

    /**
     * 创建光线集合
     * @param range 
     * @param weightList 
     */
    function CreateLightRange (range: LightSeepRangePart, weightList: WeightRec[], itemList: LightSeepRangePart[]) {
        weightList.sort((a, b) => {
            return a.weight - b.weight;
        });
        let rayRecList = weightList.map((ele) => {
            return ele.rec;
        });
        rayRecList.unshift(new RayRec(
            range.ray0.p0.pos.elements[0],
            range.ray0.p0.pos.elements[1],
            range.ray0.p0.power,

            range.ray0.p1.pos.elements[0],
            range.ray0.p1.pos.elements[1],
            range.ray0.p1.power
        ));
        rayRecList.push(new RayRec(
            range.ray1.p0.pos.elements[0],
            range.ray1.p0.pos.elements[1],
            range.ray1.p0.power,

            range.ray1.p1.pos.elements[0],
            range.ray1.p1.pos.elements[1],
            range.ray1.p1.power
        ));
        // 生成真正的光束
        for (let rayRecIndex = 1; rayRecIndex < rayRecList.length; rayRecIndex++) {
            let pre = rayRecList[rayRecIndex - 1];
            let curr = rayRecList[rayRecIndex];
            let genRange = new LightSeepRangePart();
            genRange.LoadData(
                pre.p1x,
                pre.p1y,
                pre.p1Power,
                pre.p2x,
                pre.p2y,
                pre.p2Power,

                curr.p1x,
                curr.p1y,
                curr.p1Power,
                curr.p2x,
                curr.p2y,
                curr.p2Power
            );
            itemList.push(genRange);
        };
    }

    let _vec3 = new CuonVector3();

    let _right = new CuonVector3();

    /**
     * 根据与光源的距离对方块进行排序
     * @param vec 光照方向
     * @param rectList 矩形列表
     */
    export function SortByDistance (vec: CuonVector3, rectList: LightSeepRect[]) {
        vec.GetRight(_right);
        rectList.sort(( rectA, rectB ) => {
            let ableA = rectA.FindSplit(rectB, _vec3);
            if (ableA) {
                return -CuonVector3.Dot(_vec3, _right);
            };
            let ableB = rectB.FindSplit(rectA, _vec3);
            if (ableB) {
                return CuonVector3.Dot(_vec3, _right);
            };
            return CuonVector3.Dot(vec, rectA.pos) - CuonVector3.Dot(vec, rectB.pos);
        });
    }
}

export default lightSeep;