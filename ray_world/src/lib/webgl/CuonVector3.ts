import CuonMatrix4 from "./CuonMatrix4";

/**
 * 3 维向量
 */
class CuonVector3 {
    /**
     * 向量的核心数据
     */
    public elements: Float32Array;

    public constructor () {
        var v = new Float32Array(3);
        this.elements = v;
    }

    /**
     * 归一化
     * @returns 
     */
    public Normalize () {
        var v = this.elements;
        var c = v[0], d = v[1], e = v[2], g = Math.sqrt(c*c+d*d+e*e);
        if(g){
            if(g === 1) {
                return this;
            };
        } 
        else {
          v[0] = 0; v[1] = 0; v[2] = 0;
          return this;
        };
        g = 1/g;
        v[0] = c*g; v[1] = d*g; v[2] = e*g;
        return this;
    };

    /**
     * 获取右向量
     * @returns 
     */
    public GetRight () {
        return rightMat4.multiplyVector3(this);
    }

    /**
     * 检测是否点集合里面所有点都在右侧
     * @param posList 
     */
    public CheckIsAllRightSide (posList: CuonVector3[]) {
        // 0 向量没有右
        if (this.elements[0] == 0 && this.elements[1] == 0 && this.elements[2] == 0) {
            return false;
        };
        // 获取右向量
        let right = this.GetRight();
        // 如果集合里面所有点在右向量的投影均大于等于 0，那么确实全部都在右侧
        if (posList.every((pos) => {
            let dot = CuonVector3.Dot(right, pos);
            return 0 <= dot;
        })) 
        {
            return true;
        };
        return false;
    }
}

namespace CuonVector3 {
    /**
     * 使用 x、y 创建实例
     * @param x 
     * @param y 
     * @returns 
     */
    export function CreateByXY (
        x: number,
        y: number
    )
    {
        let vec = new CuonVector3();
        vec.elements[0] = x;
        vec.elements[1] = y;
        vec.elements[2] = 0;
        return vec;
    }

    /**
     * 取得点积
     * @param vec1 
     * @param vec2 
     * @returns 
     */
    export function Dot (
        vec1: CuonVector3,
        vec2: CuonVector3
    )
    {
        return vec1.elements[0] * vec2.elements[0] + vec1.elements[1] * vec2.elements[1] + vec1.elements[2] * vec2.elements[2];
    }

    /**
     * 获取俩个点的相对矢量
     * @param p1 
     * @param p2 
     * @returns 
     */
    export function GetP1P2 (p1: CuonVector3, p2: CuonVector3) {
        let p1p2 = new CuonVector3();
        p1p2.elements[0] = p2.elements[0] - p1.elements[0];
        p1p2.elements[1] = p2.elements[1] - p1.elements[1];
        p1p2.elements[2] = p2.elements[2] - p1.elements[2];
        return p1p2;
    }

    /**
     * 俩个点集合按逆时针顺序分别组成俩个形状，检测俩个形状是否有交集
     * @param shape1 
     * @param shape2 
     */
    export function CheckHasIntersection (shape1: CuonVector3[], shape2: CuonVector3[]) {
        // 如果 shape2 均在 shape1 某条边的右侧，那么无交集
        for (let i1 = 0; i1 < shape1.length; i1++) {
            let currPoint = shape1[i1];
            let nextPoint = shape1[(i1 + 1) % shape1.length];
            let relVec = GetP1P2(currPoint, nextPoint);
            if (relVec.CheckIsAllRightSide(
                shape2.map((p2) => {
                    return GetP1P2(currPoint, p2);
                })
            ))
            {
                return false;
            };
        };
        // 如果 shape1 均在 shape2 某条边的右侧，那么无交集
        for (let i2 = 0; i2 < shape2.length; i2++) {
            let currPoint = shape2[i2];
            let nextPoint = shape2[(i2 + 1) % shape2.length];
            let relVec = GetP1P2(currPoint, nextPoint);
            if (relVec.CheckIsAllRightSide(
                shape1.map((p1) => {
                    return GetP1P2(currPoint, p1);
                })
            )) 
            {
                return false;
            };
        };
        return true;
    }
}

// 用于向右偏转的矩阵
const rightMat4 = new CuonMatrix4();
rightMat4.setRotate(-90, 0, 0, 1);

export default CuonVector3;