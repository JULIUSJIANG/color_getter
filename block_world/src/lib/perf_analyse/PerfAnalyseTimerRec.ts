import ObjectPoolType from "../object_pool/ObjectPoolType";

/**
 * 标签记录
 */
export default class PerfAnalyseTimerRec {
    /**
     * 标签
     */
    tag: any;
    /**
     * 时间戳
     */
    timer: number;

    /**
     * 对象池类型
     */
    public static type = new ObjectPoolType(
        () => {
            return new PerfAnalyseTimerRec();
        },
        (inst) => {

        },
        (inst) => {
            
        }
    )
}
