/**
 * id 生成器
 */
export default class IdGeneration {
    /**
     * 当前标识
     */
    private _id = 0;

    /**
     * 生成 id
     * @returns 
     */
    public Gen () {
        return ++this._id;
    }
}