import CuonVector3 from "../../lib/webgl/CuonVector3";
import globalConfig from "../GlobalConfig";
import TouchMachine from "./TouchMachine";

/**
 * 交互状态
 */
export default abstract class TouchMachineState {

    /**
     * 归属的状态机
     */
    public machine: TouchMachine = null as any;

    public constructor (machine: TouchMachine) {
        this.machine = machine;
    }

    /**
     * 状态进入
     */
    public onEnter () {

    }

    /**
     * 状态退出
     */
    public onExit () {

    }

    public onMouseHover (mouseEvent: MouseEvent) {

    }

    public onMouseDown (mouseEvent: MouseEvent) {
        
    }

    public onMouseUp (mouseEvent: MouseEvent) {

    }

    getTouchCanvasPos (mouseEvent: MouseEvent) {
        let x = mouseEvent.clientX;
        let y = mouseEvent.clientY;
        let rect = this.machine.colorGetter.canvas.getBoundingClientRect();
        let xInCanvas = x - rect.left;
        let yInCanvas = rect.bottom - y;

        return [xInCanvas, yInCanvas];
    }

    getTouchWorldPos (mouseEvent: MouseEvent) {
        let touchLocation = this.getTouchCanvasPos(mouseEvent);

        let touchPos = new CuonVector3();
        touchPos.elements[0] = (touchLocation[0] / globalConfig.CANVAS_SIZE - 0.5) * 2;
        touchPos.elements[1] = (touchLocation[1] / globalConfig.CANVAS_SIZE - 0.5) * 2;
        touchPos.elements[2] = 0;

        touchPos = this.machine.colorGetter.vpR.multiplyVector3(touchPos);

        return touchPos;
    }
}