import root from "../Root";
import TouchStatus from "./TouchStatus";

/**
 * 交互状态-待机
 */
export default class TouchStatusIdle extends TouchStatus {
    public OnMouseDown () {
        switch (root.store.getState().opIndex) {
            case 0: {
                this.machine.SetStatus(this.machine.statusDragScene);
                break;
            };
            case 1: {
                this.machine.SetStatus(this.machine.statusAddBlock);
                break;
            };
            case 2: {
                this.machine.SetStatus(this.machine.statusRemBlock);
                break;
            };
        };
    }
}