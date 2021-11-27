/**
 * 全对象池-实例
 */
export default abstract class ObjectRefInst<T> {
    /**
     * 归属的数据核心
     */
    public relIndex: T;

    /**
     * 在类型中的标识
     */
     public id: number;

     /**
      * 当初始化的时候
      */
     public OnInit () {

     }

     /**
      * 当被销毁的时候
      */
     public OnDestory () {

     }
}