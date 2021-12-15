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
}

const rightMat4 = new CuonMatrix4();
rightMat4.setRotate(-90, 0, 0, 1);

export default CuonVector3;