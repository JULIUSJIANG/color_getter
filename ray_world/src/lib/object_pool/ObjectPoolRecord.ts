import { type } from "os";
import ObjectPoolType from "./ObjectPoolType";

/**
 * 对象池记录
 */
export default class ObjectPoolRecord<T> {

    /**
     * 对应的类型
     */
    public type: ObjectPoolType<T>;

    constructor (
        type: ObjectPoolType<T>
    )
    {
        this.type = type;
    }

    /**
     * 实际的缓存池
     */
    _pool: T[] = [];

    /**
     * 提取实例
     * @returns 
     */
    public Pop () {
        if (this._pool.length == 0) {
            this._pool.push(this.type.instantiate());
        };
        let inst = this._pool.pop();
        this.type.onPop(inst);
        return inst;
    }

    /**
     * 存储实例
     * @param inst 
     * @returns 
     */
    public Push (inst: T) {
        if (inst == null) {
            return;
        };
        if (0 <= this._pool.indexOf(inst)) {
            return;
        };
        this._pool.push(inst);
        this.type.onPush(inst);
    }
}