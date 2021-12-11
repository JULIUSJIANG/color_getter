/**
 * 4 维向量
 */
export default class CuonVector4 {

    /**
     * 向量的核心数据
     */
    public elements: Float32Array;

    public constructor () {
        var v = new Float32Array(4);
        this.elements = v;
    }
}