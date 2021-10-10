/**
 * 3 维向量
 */
export default class CuonVector3 {
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
            if(g == 1) {
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
}