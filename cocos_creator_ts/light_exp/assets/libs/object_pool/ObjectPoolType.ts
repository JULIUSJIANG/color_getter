/**
 * 对象池类型
 */
export default class ObjectPoolType<T> {

    /**
     * 构造器
     */
    private _creator: () => T;

    /**
     * 当提取出来的时候
     */
    private _onPop: (t: T) => void;

    /**
     * 当回收的时候
     */
    private _onPush: (t: T) => void;

    public constructor (
        creator: () => T,
        onPop: (t: T) => void,
        onPush: (t: T) => void
    ) 
    {
        this._creator = creator;
        this._onPop = onPop;
        this._onPush = onPush;
    }

    public Create (): T {
        return this._creator();
    }

    public OnPop (t: T) {
        if (this._onPop == null) {
            return;
        };
        this._onPop(t);
    }

    public OnPush (t: T) {
        if (this._onPush == null) {
            return;
        };
        this._onPush(t);
    }
}