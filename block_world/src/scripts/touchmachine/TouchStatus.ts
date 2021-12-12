import root from "../Root";
import TouchMachine from "./TouchMachine";

/**
 * 交互状态
 */
export default abstract class TouchStatus {

    /**
     * 交互的状态机
     */
    public machine?: TouchMachine;

    public constructor (
        machine: TouchMachine
    ) 
    {
        this.machine = machine;
    }

    public OnEnter () {

    }

    public OnExit () {

    }

    public OnMouseDown () {

    }

    public OnMouseMove () {

    }

    public OnMouseUP () {

    }

    CheckGridEmpty () {
        let gridRec = root.store.getState().blockXRec.find((ele) => {
            return ele.gridX == this.machine.touchGridX;
        });
        if (gridRec == null) {
            return true;
        };
        let yRec = gridRec.yCollect.find((ele) => {
            return ele.gridY == this.machine.touchGridY;
        });
        if (yRec == null) {
            return true;
        };
        return false;
    }
}