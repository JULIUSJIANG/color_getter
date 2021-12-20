import perfAnalyse from "../../lib/perf_analyse/PerfAnalyse";
import root from "../Root";
import TouchStatus from "./TouchStatus";

/**
 * 交互状态-拖拽场景
 */
export default class TouchStatusDragScene extends TouchStatus {
    /**
     * 初始化时候的相机 x 位置
     */
    initCameraX?: number;

    /**
     * 初始化时候的相机 y 位置
     */
    initCameraY?: number;

    public override OnEnter () {
        this.initCameraX = root.store.getState().cameraX;
        this.initCameraY = root.store.getState().cameraY;
    }

    public override OnMouseMove () {
        root.reducerSetCameraPos.Eff([
            this.initCameraX - this.machine.posMove.elements[0] + this.machine.posStart.elements[0],
            this.initCameraY - this.machine.posMove.elements[1] + this.machine.posStart.elements[1]
        ]);
    }

    public override OnMouseUP () {
        // 回到拖拽状态
        this.machine.SetStatus(this.machine.statusIdle);
    }
}