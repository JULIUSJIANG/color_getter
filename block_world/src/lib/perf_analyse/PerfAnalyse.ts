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
        };
        for (let recI = 0; recI < timerRecList.length; recI++) {
            let inst = timerRecList[recI];
            recPool.Push(inst);
        };
        timerRecList.length = 0;
        catchTimes++;
    }

    /**
     * 获取总的耗时信息
     * @returns 
     */
    export function SumMsg () {
        let totalCost = 0;
        totalCostRecMap.forEach(( val, key ) => {
            totalCost += val.totalCost;
        });
        strList.push(`捕获次数:${catchTimes} 累计耗时:${totalCost}`);
        totalCostRecMap.forEach(( val, key ) => {
            strList.push(`${key} 累计[${val.totalCost}] 平均[${Math.ceil(val.totalCost/catchTimes*100)/100}] 占比[${Math.ceil(val.totalCost/totalCost*100)}%]`);
        });
        let result = strList.join(`\n`);
        strList.length = 0;
        return result;
    }
}

/**
 * 已捕获的次数
 */
let catchTimes: number = 0;
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