/**
 * 对象池类型
 */
export default class ObjectPoolType<T> {

    /**
     * 构造器
     */
    private _creator: () => T;

    public constructor (
        creator: () => T
    ) 
    {
        this._creator = creator;
    }

    public Create (): T {
        return this._creator();
    }
}