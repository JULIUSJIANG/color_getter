import ObjectPoolRecord from "./ObjectPoolRecord";
import ObjectPoolType from "./ObjectPoolType";

/**
 * 对象池
 */
export default class ObjectPool {
    /**
     * 类型以及具体记录的映射
     */
    private _typeRecMap: Map<ObjectPoolType<any>, ObjectPoolRecord<any>> = new Map();

    /**
     * 提取实例
     * @param type 
     */
    public Pop<T> (type: ObjectPoolType<T>) {
        this.Promise(type);
        return this._typeRecMap.get(type).Pop();
    }

    /**
     * 存储实例
     * @param type 
     * @param t 
     */
    public Push<T> (type: ObjectPoolType<T>, t: T) {
        this.Promise(type);
        this._typeRecMap.get(type).Push(t);
    }

    /**
     * 确保记录存在
     * @param type 
     * @returns 
     */
    private Promise (type: ObjectPoolType<any>) {
        if (this._typeRecMap.has(type)) {
            return;
        };
        this._typeRecMap.set(type, new ObjectPoolRecord(type));
    }
}