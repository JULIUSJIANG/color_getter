import RootComponet from "../RootComponent";
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
        this.initCameraX = RootComponet.inst.state.cameraX;
        this.initCameraY = RootComponet.inst.state.cameraY;
    }

    public override OnMouseMove () {
        if (!RootComponet.inst) {
            return;
        };
        RootComponet.inst.setState({
            ...RootComponet.inst.state,
            cameraX: this.initCameraX - this.machine.posMove.elements[0] + this.machine.posStart.elements[0],
            cameraY: this.initCameraY - this.machine.posMove.elements[1] + this.machine.posStart.elements[1],
        });
    }

    public override OnMouseUP () {
        // 回到拖拽状态
        this.machine.SetStatus(this.machine.statusIdle);
    }
}