import IdGeneration from "./IdGeneration";
import ObjectPoolRec from "./object_pool/ObjectPoolRec";

/**
 * 全对象池管控器
 */
export default class OperationCtrl<InstType> {
    /**
     * id 生成器
     */
    private _idGen: IdGeneration = new IdGeneration();

    /**
     * 已经生成出来的实例字典
     */
    private _instMap: Map<number, InstType> = new Map();

    /**
     * 对象池记录
     */
    private _poolRec: ObjectPoolRec<InstType>;

    public constructor (
        poolRec: ObjectPoolRec<InstType>
    )
    {
        this._poolRec = poolRec;
    }

    /**
     * 创建实例
     */
    public Create (...args): number {
        let id = this._idGen.Gen();
        let inst = this._poolRec.Pop();
        this._instMap.set(id, inst);
        // 只返回 id
        return id;
    }

    /**
     * 销毁
     */
    public Destory (id: number) {
        // 记录根本不存在，忽略
        if (!this._instMap.has(id)) {
            return;
        };
        let inst = this._instMap.get(id);
        // 移除记录
        this._instMap.delete(id);
        // 回收
        this._poolRec.Push(inst);
    }

    /**
     * 操作
     */
    public Op<T> (id: number, op: (t: InstType, ...args) => T, ...args) {
        if (!this._instMap.has(id)) {
            return null;
        };
        let inst = this._instMap.get(id);
        return op(inst, ...args);
    }
}