import CuonVector3 from "../../lib/webgl/CuonVector3";
import { GlobalState } from "../GlobalState";
import TouchMachineState from "./TouchMachineState";

/**
 * 交互状态-正在拖拽 y
 */
export default class TouchMachineStateDragY extends TouchMachineState {
    /**
     * 触摸的位置
     */
     touchBegin: number = 0;
    
    /**
     * 进入该状态时候的中心点位置
     */
    initPos: number = 0;

    public onEnter () {
        let state: GlobalState = {
            ...this.machine.colorGetter.state,
            xDrag: false,
            yDrag: true,
            zDrag: false
        };
        this.initPos = state.posY;
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
        this.touchBegin = this.getTouchYPos(mouseEvent);
    }

    public onMouseHover (mouseEvent: MouseEvent) {
        let hoverPos = this.getTouchYPos(mouseEvent);
        let relY = hoverPos - this.touchBegin;
        let state: GlobalState = {
            ...this.machine.colorGetter.state,
            posY: this.initPos + relY
        }
        this.machine.colorGetter.setState(state);
    }

    public onMouseUp () {
        this.machine.enter(this.machine.stateHover);
    }
}