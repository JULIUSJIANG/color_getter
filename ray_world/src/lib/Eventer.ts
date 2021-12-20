import IdGeneration from "./IdGeneration";

/**
 * 事件派发器
 */
export default class Eventer<T> {
    /**
     * id 生成器
     */
    private _idGen = new IdGeneration();
    
    /**
     * 监听的记录
     */
    private _listenMap: Map<number, (t: T) => void> = new Map();

    /**
     * 开始监听
     * @param callback 
     */
    public On (callback: (t: T) => void) {
        let id = this._idGen.Gen();
        this._listenMap.set(id, callback);
        return id;
    }

    /**
     * 取消监听
     */
    public Off (id: number) {
        if (!this._listenMap.has(id)) {
            return;
        };
        this._listenMap.delete(id);
    }

    /**
     * 进行事件派发
     * @param t 
     */
    public Call (t?: T) {
        this._listenMap.forEach(( val ) => {
            val(t);
        });
    }
}