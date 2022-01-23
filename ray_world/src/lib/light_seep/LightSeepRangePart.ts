import CuonVector3 from "../webgl/CuonVector3";
import LightSeepRangePartRay from "./LightSeepRangePartRay";

/**
 * 探照区域的核心数据，ray0 角度小于 ray1
 */
class LightSeepRangePart {
    /**
     * 射线 0
     */
     public ray0 = new LightSeepRangePartRay();
     /**
      * 射线 1
      */
     public ray1 = new LightSeepRangePartRay();
 
     /**
      * r0 的 p0 指向 r1 的 p0 的向量
      */
     public r0r1p0vec = new CuonVector3();
     /**
      * r0 的 p1 指向 r1 的 p1 的向量
      */
     public r0r1p1vec = new CuonVector3();
 
     /**
      * r0r1p0vec 的右向量
      */
     public r0r1p0vecRight = new CuonVector3();
 
     /**
      * r0r1p1vec 的右向量
      */
     public r0r1p1vecRight = new CuonVector3();
 
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

        this.r0r1p0vec.GetRight(this.r0r1p0vecRight);
        this.r0r1p1vec.GetRight(this.r0r1p1vecRight);

        // ray0 的角度应该要比 ray1 要小，这里更正一下
        if (this.ray0.p0p1Angle == Math.PI) {
            this.ray0.p0p1Angle = -Math.PI;
        };

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
     * @param p1 
     * @param p0 
     */
     public GetPenetratePos (p1: CuonVector3, p0: CuonVector3) {
        if (this.r0r1p0vecLength == 0) {
            p0.elements[0] = this.ray0.p0.pos.elements[0];
            p0.elements[1] = this.ray0.p0.pos.elements[1];
            return;
        };

        let r0pos = CuonVector3.GetIntersection(
            this.ray0.vecp0p1Right,
            this.ray0.p0.pos,

            this.r0r1p0vecRight,
            p1
        );
        let r1pos = CuonVector3.GetIntersection(
            this.ray1.vecp0p1Right,
            this.ray1.p0.pos,

            this.r0r1p0vecRight,
            p1
        );
        let distance0 = CuonVector3.GetLen(r0pos.elements[0] - p1.elements[0], r0pos.elements[1] - p1.elements[1]);
        let distance1 = CuonVector3.GetLen(r1pos.elements[0] - p1.elements[0], r1pos.elements[1] - p1.elements[1]);
        let rate = distance0 / (distance0 + distance1);
        p0.elements[0] = this.ray0.p0.pos.elements[0] + this.r0r1p0vec.elements[0] * rate;
        p0.elements[1] = this.ray0.p0.pos.elements[1] + this.r0r1p0vec.elements[1] * rate;
    }

    /**
     * 拷贝
     * @param container 
     * @returns 
     */
    public Clone (container: LightSeepRangePart = null) {
        if (container == null) {
            container = new LightSeepRangePart();
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

    /**
     * 获取一个 r0、r1 对调的实例
     * @param reverse 
     */
    public Reverse (reverse = new LightSeepRangePart) {
        reverse.LoadData(
            this.ray1.p0.pos.elements[0],
            this.ray1.p0.pos.elements[1],
            this.ray1.p0.power,

            this.ray1.p1.pos.elements[0],
            this.ray1.p1.pos.elements[1],
            this.ray1.p1.power,

            this.ray0.p0.pos.elements[0],
            this.ray0.p0.pos.elements[1],
            this.ray0.p0.power,

            this.ray0.p1.pos.elements[0],
            this.ray0.p1.pos.elements[1],
            this.ray0.p1.power
        );
        return reverse;
    }
}

namespace LightSeepRangePart {

}

export default LightSeepRangePart;