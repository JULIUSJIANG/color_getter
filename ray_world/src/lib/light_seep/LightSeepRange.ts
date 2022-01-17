import CuonVector3 from "../webgl/CuonVector3";
import LightSeepRangeRay from "./LightSeepRangeRay";

/**
 * 光束，射线 1 、2 按照与 x 轴的逆时针夹角从小到大排序
 */
class lightSeepRange {
    /**
     * 射线 0
     */
    public ray0 = new LightSeepRangeRay();
    /**
     * 射线 1
     */
    public ray1 = new LightSeepRangeRay();

    /**
     * r0 的 p0 指向 r1 的 p0 的向量
     */
    public r0r1p0vec = new CuonVector3();
    /**
     * r0 的 p1 指向 r1 的 p1 的向量
     */
    public r0r1p1vec = new CuonVector3();

    /**
     * r0r1p1vec 的右向量
     */
    public r0r1p1vecRight = new CuonVector3();

    /**
     * 主方向
     */
    public mainDirection = new CuonVector3();

    /**
     * r0r1p0vec 的长度
     */
    public r0r1p0vecLength: number;

    /**
     * r0r1p1vec 的长度
     */
    public r0r1p1vecLength: number;

    /**
     * 形状集合
     */
    public pList: CuonVector3[];

    public constructor () {
        this.pList = [
            this.ray0.p0.pos,
            this.ray0.p1.pos,
            this.ray1.p1.pos,
            this.ray1.p0.pos
        ];
    }

    /**
     * 加载数据
     * @param r1p1x 
     * @param r1p1y 
     * @param r1p1Power 
     * @param r1p2x 
     * @param r1p2y 
     * @param r1p2Power 
     * @param r2p1x 
     * @param r2p1y 
     * @param r2p1Power 
     * @param r2p2x 
     * @param r2p2y 
     * @param r2p2Power 
     */
    public LoadData (
        r1p1x: number,
        r1p1y: number,
        r1p1Power: number,
        r1p2x: number,
        r1p2y: number,
        r1p2Power: number,

        r2p1x: number,
        r2p1y: number,
        r2p1Power: number,
        r2p2x: number,
        r2p2y: number,
        r2p2Power: number,
    )
    {
        this.ray0.LoadData(
            r1p1x,
            r1p1y,
            r1p1Power,
            r1p2x,
            r1p2y,
            r1p2Power,
        );
        this.ray1.LoadData(
            r2p1x,
            r2p1y,
            r2p1Power,
            r2p2x,
            r2p2y,
            r2p2Power,
        );

        this.r0r1p0vec.elements[0] = this.ray1.p0.pos.elements[0] - this.ray0.p0.pos.elements[0];
        this.r0r1p0vec.elements[1] = this.ray1.p0.pos.elements[1] - this.ray0.p0.pos.elements[1];

        this.r0r1p1vec.elements[0] = this.ray1.p1.pos.elements[0] - this.ray0.p1.pos.elements[0];
        this.r0r1p1vec.elements[1] = this.ray1.p1.pos.elements[1] - this.ray0.p1.pos.elements[1];

        this.r0r1p1vec.GetRight(this.r0r1p1vecRight);

        this.mainDirection.elements[0] = this.ray0.vecp0p1.elements[0] + this.ray1.vecp0p1.elements[0];
        this.mainDirection.elements[1] = this.ray0.vecp0p1.elements[1] + this.ray1.vecp0p1.elements[1];

        if (this.ray0.p0p1Distance == 0) {
            this.ray0.p0p1Angle = this.ray1.p0p1Angle;
        };

        if (this.ray1.p0p1Distance == 0) {
            this.ray1.p0p1Angle = this.ray0.p0p1Angle;
        };

        this.r0r1p0vecLength = Math.sqrt(this.r0r1p0vec.elements[0] ** 2 + this.r0r1p0vec.elements[1] ** 2);
        this.r0r1p1vecLength = Math.sqrt(this.r0r1p1vec.elements[0] ** 2 + this.r0r1p1vec.elements[1] ** 2);
    }

    /**
     * 获取能够贯穿 p2 的起点 p1
     * @param p2 
     * @param p1 
     */
    public GetPenetratePos (p2: CuonVector3, p1: CuonVector3) {
        let p1vecX = this.r0r1p0vec.elements[0];
        let p1vecY = this.r0r1p0vec.elements[1];

        let p1x = p1.elements[0];
        let p1y = p1.elements[1];
        let r1rightX = this.ray0.vecp0p1Right.elements[0];
        let r1rightY = this.ray0.vecp0p1Right.elements[1];
        let r1p1x = this.ray0.p0.pos.elements[0];
        let r1p1y = this.ray0.p0.pos.elements[1];
        let a1 = ((- p1y * r1rightY + r1p1y * r1rightY) - (p1x * r1rightX - r1p1x * r1rightX)) / (p1vecX * r1rightX + p1vecY * r1rightY);

        let p2x = p2.elements[0];
        let p2y = p2.elements[1];
        let r2rightX = this.ray1.vecp0p1Right.elements[0];
        let r2rightY = this.ray1.vecp0p1Right.elements[1];
        let r2p1x = this.ray1.p0.pos.elements[0];
        let r2p1y = this.ray1.p0.pos.elements[1];
        let a2 = ((- p2y * r2rightY + r2p1y * r2rightY) - (p2x * r2rightX - r2p1x * r2rightX)) / (p1vecX * r2rightX + p1vecY * r2rightY);

        // a1 占比
        let rate: number;

        if (
            a1 == 0
            && a2 == 0
        )
        {
            rate = 0
        }
        else {
            rate = 1 - a2 / (a2 - a1)
        };

        p1.elements[0] = this.ray0.p0.pos.elements[0] + p1vecX * rate;
        p1.elements[1] = this.ray0.p0.pos.elements[1] + p1vecY * rate;
    }

    /**
     * 拷贝
     * @param container 
     * @returns 
     */
    public Clone (container: lightSeepRange = null) {
        if (container == null) {
            container = new lightSeepRange();
        };
        container.LoadData(
            this.ray0.p0.pos.elements[0],
            this.ray0.p0.pos.elements[1],
            this.ray0.p0.power,
            this.ray0.p1.pos.elements[0],
            this.ray0.p1.pos.elements[1],
            this.ray0.p1.power,
            this.ray1.p0.pos.elements[0],
            this.ray1.p0.pos.elements[1],
            this.ray1.p0.power,
            this.ray1.p1.pos.elements[0],
            this.ray1.p1.pos.elements[1],
            this.ray1.p1.power
        );
        return container;
    }
}

namespace lightSeepRange {

}

export default lightSeepRange;