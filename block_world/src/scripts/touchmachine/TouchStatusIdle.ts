import RootComponet from "../RootComponent";
import TouchStatus from "./TouchStatus";

/**
 * 交互状态-待机
 */
export default class TouchStatusIdle extends TouchStatus {
    public OnMouseDown () {
        if (!RootComponet.inst) {
            return;
        };
        switch (RootComponet.inst.state.opIndex) {
            case 0: {
                this.machine.SetStatus(this.machine.statusDragScene);
                break;
            };
        };
    }
}