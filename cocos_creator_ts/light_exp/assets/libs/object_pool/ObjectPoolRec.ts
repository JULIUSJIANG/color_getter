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

    /**
     * 当前正在使用的记录
     */
    private _activeArr: Array<T> = [];

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
        let t: T;
        // 没有缓存，那么直接创建实例
        if (this._instArr.length == 0) {
            t = this._poolType.Create();
        }
        else {
            // 直接从集合中提取
            t = this._instArr.pop();
        };
        this._activeArr.push(t);
        this._poolType.OnPop(t);
        return t;
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
        this._activeArr.splice(this._activeArr.indexOf(t), 1);
        this._instArr.push(t);
        this._poolType.OnPush(t);
    }

    /**
     * 当前正在使用的记录
     */
    private _tempArr: Array<T> = [];
    /**
     * 回收全部
     */
    public RecoverAll () {
        this._tempArr.length = 0;
        this._tempArr.push(...this._activeArr);
        this._tempArr.forEach(( val ) => {
            this.Push(val);
        });
    }
}