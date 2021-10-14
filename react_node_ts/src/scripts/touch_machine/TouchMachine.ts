import ColorGetter from "../ColorGetter";
import TouchMachineState from "./TouchMachineState";
import TouchMachineStateDragX from "./TouchMachineStateDragX";
import TouchMachineStateDragY from "./TouchMachineStateDragY";
import TouchMachineStateDragZ from "./TouchMachineStateDragZ";
import TouchMachineStateHover from "./TouchMachineStateHover";

/**
 * 交互的状态机
 */
export default class TouchMachine {

    public colorGetter: ColorGetter = null as any;

    public currState: TouchMachineState = null as any;

    public stateHover: TouchMachineStateHover = null as any;

    public stateDragX: TouchMachineStateDragX = null as any;

    public stateDragY: TouchMachineStateDragY = null as any;

    public stateDragZ: TouchMachineStateDragZ = null as any;

    public constructor (colorGetter: ColorGetter) {
        this.colorGetter = colorGetter;

        this.stateHover = new TouchMachineStateHover(this);
        this.stateDragX = new TouchMachineStateDragX(this);
        this.stateDragY = new TouchMachineStateDragY(this);
        this.stateDragZ = new TouchMachineStateDragZ(this);

        this.enter(this.stateHover);
    }

    public enter (freshState: TouchMachineState) {
        let passedState = this.currState;
        this.currState = freshState;
        if (passedState != null) {
            passedState.onExit();
        };
        this.currState.onEnter();
    }
}