import CuonVector3 from "../webgl/CuonVector3";
import LightSeepRangePart from "./LightSeepRangePart";

/**
 * 光束，射线 1 、2 按照与 x 轴的逆时针夹角从小到大排序
 */
class LightSeepRange { 
    /**
     * 主方向
     */
    public mainDirection = new CuonVector3();

    /**
     * 角度范围集合，提出这个概念，是为了解决情况“夹角向右”，该情况下范围会划分为 2 个部分
     */
    public partList: LightSeepRangePart[] = [];

    /**
     * 能够代表形状的点集合
     */
    public pList: CuonVector3[] = [];

    /**
     * 加载数据
     * @param r0p0x 
     * @param r0p0y 
     * @param r0p0Power 
     * @param r0p1x 
     * @param r0p1y 
     * @param r0p1Power 
     * @param r1p0x 
     * @param r1p0y 
     * @param r1p0Power 
     * @param r1p1x 
     * @param r1p1y 
     * @param r1p1Power 
     */
    public LoadData (
        r0p0x: number,
        r0p0y: number,
        r0p0Power: number,
        r0p1x: number,
        r0p1y: number,
        r0p1Power: number,

        r1p0x: number,
        r1p0y: number,
        r1p0Power: number,
        r1p1x: number,
        r1p1y: number,
        r1p1Power: number,
    )
    {
        this.mainDirection.elements[0] = r0p1x - r0p0x + r1p1x - r1p0x;
        this.mainDirection.elements[1] = r0p1y - r0p0y + r1p1y - r1p0y;

        let r0Angle = Math.atan2(r0p1y - r0p0y, r0p1x - r0p0x);
        let r1Angle = Math.atan2(r1p1y - r1p0y, r1p1x - r1p0x);

        // 俩个角度都能表示 x 轴负方向，但是只取小的那个
        if (r0Angle == Math.PI) {
            r0Angle = -Math.PI;
        };

        // 位置重合的话，取另一边的角度作为自己的角度
        if (r0p1y == r0p0y && r0p1x == r0p0x) {
            r0Angle = r1Angle;
        };
        if (r1p1y == r1p0y && r1p1x == r1p0x) {
            r1Angle = r0Angle;
        };

        // 如果角度顺序不对，那么对调一下数据
        if (r1Angle < r0Angle) {
            [
                r0p0x,
                r0p0y,
                r0p0Power,
                r0p1x,
                r0p1y,
                r0p1Power,

                r1p0x,
                r1p0y,
                r1p0Power,
                r1p1x,
                r1p1y,
                r1p1Power,

                r0Angle,
                r1Angle
            ] = [
                r1p0x,
                r1p0y,
                r1p0Power,
                r1p1x,
                r1p1y,
                r1p1Power,

                r0p0x,
                r0p0y,
                r0p0Power,
                r0p1x,
                r0p1y,
                r0p1Power,

                r1Angle,
                r0Angle
            ]
        };

        this.partList.length = 0;
        this.pList.length = 0;
        let sub = r1Angle - r0Angle;
        // 夹角向左
        if (Math.PI < sub) {
            // 总量
            let total = (2 * Math.PI) - (sub);
            // 左向比率
            let leftRate = (Math.PI + r0Angle) / total;
            // 左向偏移
            let p0 = new CuonVector3();
            p0.elements[0] = (r1p0x - r0p0x) * leftRate + r0p0x;
            p0.elements[1] = (r1p0y - r0p0y) * leftRate + r0p0y;
            // r0p1 指向 r1p1 的向量
            let r0r1p1Vec = new CuonVector3();
            r0r1p1Vec.elements[0] = r1p1x - r0p1x;
            r0r1p1Vec.elements[1] = r1p1y - r0p1y;
            // 分割点
            let p1 = CuonVector3.GetIntersection(
                CuonVector3.top,
                p0,

                r0r1p1Vec.GetRight(r0r1p1Vec),
                new CuonVector3(r0p1x, r0p1y)
            );
            // 计算强度插值
            let p0Power = (r1p0Power - r0p0Power) * leftRate + r0p0Power;
            let p1Power = (r1p1Power - r0p1Power) * leftRate + r0p1Power;

            // 部分-0
            let part0 = new LightSeepRangePart();
            part0.LoadData(
                p0.elements[0],
                p0.elements[1],
                p0Power,

                p1.elements[0],
                p1.elements[1],
                p1Power,

                r0p0x,
                r0p0y,
                r0p0Power,

                r0p1x,
                r0p1y,
                r0p1Power
            );
            this.partList.push(part0);

            // 部分-1
            let part1 = new LightSeepRangePart();
            part1.LoadData(
                r1p0x,
                r1p0y,
                r1p0Power,

                r1p1x,
                r1p1y,
                r1p1Power,

                p0.elements[0],
                p0.elements[1],
                p0Power,

                p1.elements[0],
                p1.elements[1],
                p1Power
            );
            this.partList.push(part1);

            this.pList.push(part0.ray1.p1.pos);
            this.pList.push(part0.ray1.p0.pos);
            this.pList.push(part1.ray0.p0.pos);
            this.pList.push(part1.ray0.p1.pos);
        }
        // 夹角向右
        else {
            let part = new LightSeepRangePart();
            part.LoadData(
                r0p0x,
                r0p0y,
                r0p0Power,
                r0p1x,
                r0p1y,
                r0p1Power,

                r1p0x,
                r1p0y,
                r1p0Power,
                r1p1x,
                r1p1y,
                r1p1Power
            );
            this.partList.push(part);
            // 直接把形状拷贝过来
            this.pList.push(...part.pList);
        };
    }
}

namespace lightSeepRange {

}

export default LightSeepRange;