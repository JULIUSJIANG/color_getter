import ObjectPoolType from "./ObjectPoolType";

/**
 * 单类型对象池
 */
export default class ObjectPoolRec<T> {
    /**
     * 对象池类型
     */
    private _poolType: ObjectPoolType<T>;

    /**
     * 实例记录
     */
    private _instArr: Array<T> = [];

    public constructor (
        poolType: ObjectPoolType<T>
    )
    {
        this._poolType = poolType;
    }

    /**
     * 提取实例
     */
    public Pop (): T {
        // 没有缓存，那么直接创建实例
        if (this._instArr.length == 0) {
            return this._poolType.Create();
        };
        // 直接从集合中提取
        return this._instArr.pop();
    }

    /**
     * 存入实例
     * @param t 
     */
    public Push (t: T) {
        // 如果本来就在集合里面，当然要忽略
        if (0 <= this._instArr.indexOf(t)) {
            return;
        };
        this._instArr.push(t);
    }
}