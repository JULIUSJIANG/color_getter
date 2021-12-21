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
}