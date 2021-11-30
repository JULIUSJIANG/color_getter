import ObjectPoolRec from "./ObjectPoolRec";
import ObjectPoolType from "./ObjectPoolType";

/**
 * 对象池
 */
export default class ObjectPool {
    /**
     * 提取实例
     * @param poolType 
     */
    public Pop<T> (poolType: ObjectPoolType<T>) {
        return this.GetRec(poolType).Pop();
    }

    /**
     * 存放实例
     * @param poolType 
     * @param t 
     */
    public Push<T> (poolType: ObjectPoolType<T>, t: T) {
        this.GetRec(poolType).Push(t);
    }

    /**
     * 回收全部
     */
    public RecoverAll () {
        this._typeInstMap.forEach(( val ) => {
            val.RecoverAll();
        });
    }

    /**
     * 类型以及具体记录的字典
     */
    private _typeInstMap: Map<ObjectPoolType<any>, ObjectPoolRec<any>> = new Map();

    /**
     * 访问类别记录
     * @param poolType 
     * @returns 
     */
    public GetRec<T> (poolType: ObjectPoolType<T>): ObjectPoolRec<T> {
        if (!this._typeInstMap.has(poolType)) {
            this._typeInstMap.set(poolType, new ObjectPoolRec(poolType));
        };
        return this._typeInstMap.get(poolType);
    }
}