/**
 * 对象池类型
 */
export default class ObjectPoolType<T> {

    /**
     * 实例化的接口
     */
    public instantiate: () => T;

    /**
     * 事件派发-当提取出来的时候
     */
    public onPop: (t: T) => void;
    /**
     * 事件派发-当存储起来的时候
     */
    public onPush: (t: T) => void;
    
    constructor (
        instantiate: () => T,
        onPop: (t: T) => void,
        onPush: (t: T) => void
    )
    {
        this.instantiate = instantiate;
        this.onPop = onPop;
        this.onPush = onPush;
    }
}