import CuonVector3 from "../../lib/webgl/CuonVector3";
import globalConfig from "../GlobalConfig";
import { GlobalState } from "../GlobalState";
import TouchMachineState from "./TouchMachineState";

/**
 * 交互状态-正在拖拽 z
 */
export default class TouchMachineStateDragZ extends TouchMachineState {
    /**
     * 触摸的位置
     */
    touchBegin: CuonVector3 = null as any;
    
     /**
      * 进入该状态时候的中心点位置
      */
    initPos: number = 0;

    public onEnter () {
        let state: GlobalState = {
            ...this.machine.colorGetter.state,
            xDrag: false,
            yDrag: false,
            zDrag: true
        };
        this.initPos = state.posZ;
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
        this.touchBegin = this.getTouchYZPos(mouseEvent);
    }

    public onMouseHover (mouseEvent: MouseEvent) {
        let hoverPos = this.getTouchYZPos(mouseEvent);
        let relVec = new CuonVector3();
        relVec.elements[0] = hoverPos.elements[0] - this.touchBegin.elements[0];
        relVec.elements[1] = hoverPos.elements[1] - this.touchBegin.elements[1];
        relVec.elements[2] = hoverPos.elements[2] - this.touchBegin.elements[2];
        let willZ = this.initPos + relVec.elements[2];
        let state: GlobalState = {
            ...this.machine.colorGetter.state,
            posZ: Math.max(-globalConfig.FRAME_CUBE_SIDE_LENGTH/2, Math.min(willZ,globalConfig.FRAME_CUBE_SIDE_LENGTH/2))
        }
        this.machine.colorGetter.setState(state);
    }

    public onMouseUp () {
        this.machine.enter(this.machine.stateHover);
    }
}