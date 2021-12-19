import ObjectPoolRecord from "../object_pool/ObjectPoolRecord";
import PerfAnalyseTagRec from "./PerfAnalyseTagRec";
import PerfAnalyseTimerRec from "./PerfAnalyseTimerRec";

/**
 * 性能分析工具
 */
namespace perfAnalyse {
    /**
     * 记录某个标签的时间戳
     * @param tag 
     */
    export function Rec (tag: any) {
        let rec = recPool.Pop();
        rec.tag = tag;
        rec.timer = Date.now();
        timerRecList.push(rec);
    }

    /**
     * 进行信息捕获
     * @returns 
     */
    export function Catch () {
        if (timerRecList.length == 0) {
            return;
        };
        let cycleTag = timerRecList[0].tag
        for (let recI = 0; recI < timerRecList.length; recI++) {
            let inst = timerRecList[recI];
            // 忽略周期点
            if (inst.tag == cycleTag) {
                continue;
            };
            let previous = timerRecList[recI - 1];
            let key = `${previous.tag}-${inst.tag}`;
            if (!totalCostRecMap.has(key)) {
                totalCostRecMap.set(key, new PerfAnalyseTagRec());
            };
            // 把时间累计起来
            totalCostRecMap.get(key).totalCost += inst.timer - previous.timer;
            totalCostRecMap.get(key).times ++;
        };
        for (let recI = 0; recI < timerRecList.length; recI++) {
            let inst = timerRecList[recI];
            recPool.Push(inst);
        };
        timerRecList.length = 0;
    }

    /**
     * 获取总的耗时信息
     * @returns 
     */
    export function SumMsg () {
        let totalTtime = 0;
        totalCostRecMap.forEach(( val, key ) => {
            totalTtime += val.totalCost;
        });
        totalCostRecMap.forEach(( val, key ) => {
            strList.push(`${key}:${val}(${Math.ceil(val.totalCost/val.times*100)/100},${Math.ceil(val.totalCost/totalTtime*100)}%)`);
        });
        let result = strList.join(`\n`);
        strList.length = 0;
        return result;
    }
}
/**
 * 字符串列表
 */
let strList: string[] = [];
/**
 * 记录耗时的字典-总
 */
 let totalCostRecMap: Map<string, PerfAnalyseTagRec> = new Map();
/**
 * 记录专用的对象池
 */
let recPool = new ObjectPoolRecord(PerfAnalyseTimerRec.type);
/**
 * 当前的所有记录
 */
let timerRecList: PerfAnalyseTimerRec[] = [];

export default perfAnalyse;