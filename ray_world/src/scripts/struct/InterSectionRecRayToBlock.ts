import InterSectionRecRayToLine from "./InterSectionRecRayToLine";

/**
 * 交点记录-射线与方块
 */
export default interface InterSectionRecRayToBlock {
    /**
     * 穿透点
     */
    crossPoint: InterSectionRecRayToLine[];
    /**
     * 穿透距离
     */
    crossDistance: number;
}