import CuonVector3 from "../webgl/CuonVector3";

/**
 * 可渗透矩形
 */
class LightSeepRect {
    /**
     * 阻尼
     */
    public damping: number = 0;
    /**
     * 矩形位置
     */
    public pos = new CuonVector3();
    /**
     * 弧度制旋转角
     */
    public piAngle: number = 0;
    /**
     * 分别存储着宽、高
     */
    public size = new CuonVector3();

    /**
     * 点-左下
     */
    public plb = new CuonVector3();

    /**
     * 点-右下
     */
    public prb = new CuonVector3();

    /**
     * 点-右上
     */
    public prt = new CuonVector3();

    /**
     * 点-左上
     */
    public plt = new CuonVector3();

    /**
     * 向量- 左向右
     */
    public vecX = new CuonVector3();

    /**
     * 向量- 下向上
     */
    public vecY = new CuonVector3();

    /**
     * 点集合
     */
    public pList: CuonVector3[];

    public constructor () {
        this.pList = [
            this.plb,
            this.prb,
            this.prt,
            this.plt
        ];
    }

    /**
     * 加载数据
     * @param damping 
     * @param x 
     * @param y 
     * @param piAngle 
     * @param width 
     * @param height 
     */
    public LoadData (
        damping: number,
        x: number,
        y: number,
        piAngle: number,
        width: number,
        height: number
    )
    {
        this.damping = damping;
        this.pos.elements[0] = x;
        this.pos.elements[1] = y;
        this.piAngle = piAngle;
        this.size.elements[0] = width;
        this.size.elements[1] = height;

        this.vecX.elements[0] = Math.cos(piAngle);
        this.vecX.elements[1] = Math.sin(piAngle);

        this.vecX.GetLeft(this.vecY);

        this.prt.elements[0] = this.pos.elements[0] + this.vecX.elements[0] * this.size.elements[0] / 2 + this.vecY.elements[0] * this.size.elements[1];
        this.prt.elements[1] = this.pos.elements[1] + this.vecX.elements[1] * this.size.elements[1] / 2 + this.vecY.elements[1] * this.size.elements[1];

        this.prb.elements[0] = this.pos.elements[0] + this.vecX.elements[0] * this.size.elements[0] / 2 - this.vecY.elements[0] * this.size.elements[1];
        this.prb.elements[1] = this.pos.elements[1] + this.vecX.elements[1] * this.size.elements[1] / 2 - this.vecY.elements[1] * this.size.elements[1];

        this.plb.elements[0] = this.pos.elements[0] - this.vecX.elements[0] * this.size.elements[0] / 2 - this.vecY.elements[0] * this.size.elements[1];
        this.plb.elements[1] = this.pos.elements[1] - this.vecX.elements[1] * this.size.elements[1] / 2 - this.vecY.elements[1] * this.size.elements[1];

        this.plt.elements[0] = this.pos.elements[0] - this.vecX.elements[0] * this.size.elements[0] / 2 + this.vecY.elements[0] * this.size.elements[1];
        this.plt.elements[1] = this.pos.elements[1] - this.vecX.elements[1] * this.size.elements[1] / 2 + this.vecY.elements[1] * this.size.elements[1];
    }

    /**
     * 查找切割向量
     * @param rect 
     */
    public FindSplit (rect: LightSeepRect, vec: CuonVector3): boolean {
        // 穷举所有点
        for (let i = 0; i < this.pList.length; i++) {
            let currP = this.pList[i];
            let nextP = this.pList[(i + 1) % this.pList.length];
            let vecX = nextP.elements[0] - currP.elements[0];
            let vecY = nextP.elements[1] - currP.elements[1];
            // 如果该矩形所有点都在该向量右方
            if (rect.pList.every((ele) => {
                return 0 <= (ele.elements[0] - currP.elements[0]) * vecX + (ele.elements[1] - currP.elements[1]) * vecY;
            })) 
            {
                vec.elements[0] = vecX;
                vec.elements[1] = vecY;
                return true;
            };
        };
        return false;
    }

    /**
     * 获取交点
     */
    public GetCrossedPoint (kRight: CuonVector3, b: CuonVector3, posList: CuonVector3[] = [], directionData: Map<CuonVector3, number> = new Map()) {
        let k = kRight.GetLeft(new CuonVector3());
        k.Normalize();
        posList.length = 0;
        // 交点集合
        posList.push(
            CuonVector3.GetIntersection(
                kRight,
                b,
                this.vecX,
                this.plb
            )
        );
        posList.push(
            CuonVector3.GetIntersection(
                kRight,
                b,
                this.vecY,
                this.plb
            )
        );
        posList.push(
            CuonVector3.GetIntersection(
                kRight,
                b,
                this.vecX,
                this.prt
            )
        );
        posList.push(
            CuonVector3.GetIntersection(
                kRight,
                b,
                this.vecY,
                this.prt
            )
        );
        directionData.clear();

        // 计算向量数据
        posList.forEach(( p ) => {
            directionData.set(p, CuonVector3.Dot(k, CuonVector3.GetP1P2(b, p)));
        });
    
        // 从近到远排序
        posList.sort(( pA, pB ) => {
            return directionData.get(pA) - directionData.get(pB);
        });

        
        // 只取中间 2 个点
        posList.shift();
        posList.pop();

        return this.pList;
    }
}

namespace LightSeepRect {

}

export default LightSeepRect;