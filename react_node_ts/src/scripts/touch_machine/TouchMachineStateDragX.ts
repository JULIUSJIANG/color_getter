import CuonVector3 from "../../lib/webgl/CuonVector3";
import globalConfig from "../GlobalConfig";
import { GlobalState } from "../GlobalState";
import TouchMachineState from "./TouchMachineState";

/**
 * 交互状态-正在拖拽 x
 */
export default class TouchMachineStateDragX extends TouchMachineState {
    public onEnter () {
        let state: GlobalState = {
            ...this.machine.colorGetter.state,
            xDrag: true,
            yDrag: false,
            zDrag: false
        };
        this.machine.colorGetter.setState(state);
    }

    public onExit () {
        let state: GlobalState = {
            ...this.machine.colorGetter.state,
            xDrag: false,
            yDrag: false,
            zDrag: false
        };
        this.machine.colorGetter.setState(state);
    }

    public onMouseDown (mouseEvent: MouseEvent) {
        let touchWorldPos = this.getTouchWorldPos(mouseEvent);
        let n = (this.machine.colorGetter.state.posX + globalConfig.DRAG_CUBE_SIDE_LENGTH / 2 - touchWorldPos.elements[0]) / this.machine.colorGetter.cameraVec.elements[0];
        let hitTestPoint = new CuonVector3();
        hitTestPoint.elements[0] = touchWorldPos.elements[0] + this.machine.colorGetter.cameraVec.elements[0] * n;
        hitTestPoint.elements[1] = touchWorldPos.elements[1] + this.machine.colorGetter.cameraVec.elements[1] * n;
        hitTestPoint.elements[2] = touchWorldPos.elements[2] + this.machine.colorGetter.cameraVec.elements[2] * n;

        console.log(`touch[${hitTestPoint.elements[0]}, ${hitTestPoint.elements[1]}, ${hitTestPoint.elements[2]}]`);
    }

    public onMouseUp () {
        this.machine.enter(this.machine.stateHover);
    }
}