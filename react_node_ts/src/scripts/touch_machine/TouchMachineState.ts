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
        let touchLocation = new CuonVector3();
        touchLocation.elements[0] = xInCanvas;
        touchLocation.elements[1] = yInCanvas;
        touchLocation.elements[2] = 0;
        return touchLocation;
    }

    getTouchViewPos (mouseEvent: MouseEvent) {
        let touchLocation = this.getTouchCanvasPos(mouseEvent);
        touchLocation.elements[0] = (touchLocation.elements[0] / globalConfig.CANVAS_SIZE - 0.5) * 2;
        touchLocation.elements[1] = (touchLocation.elements[1] / globalConfig.CANVAS_SIZE - 0.5) * 2;
        return touchLocation;
    }

    getTouchWorldPos (mouseEvent: MouseEvent) {
        let touchLocation = this.getTouchViewPos(mouseEvent);
        touchLocation = this.machine.colorGetter.vpR.multiplyVector3(touchLocation);
        return touchLocation;
    }

    getTouchXYPos (mouseEvent: MouseEvent) {
        let touchLocation = this.getTouchWorldPos(mouseEvent);
        let n = - touchLocation.elements[2] / this.machine.colorGetter.cameraVec.elements[2];
        touchLocation.elements[0] += n * this.machine.colorGetter.cameraVec.elements[0];
        touchLocation.elements[1] += n * this.machine.colorGetter.cameraVec.elements[1];
        touchLocation.elements[2] += n * this.machine.colorGetter.cameraVec.elements[2];
        return touchLocation;
    }

    getTouchYZPos (mouseEvent: MouseEvent) {
        let touchLocation = this.getTouchWorldPos(mouseEvent);
        let n = - touchLocation.elements[0] / this.machine.colorGetter.cameraVec.elements[0];
        touchLocation.elements[0] += n * this.machine.colorGetter.cameraVec.elements[0];
        touchLocation.elements[1] += n * this.machine.colorGetter.cameraVec.elements[1];
        touchLocation.elements[2] += n * this.machine.colorGetter.cameraVec.elements[2];
        return touchLocation;
    }

    getTouchYPos (mouseEvent: MouseEvent) {
        let xyPos = this.getTouchXYPos(mouseEvent);
        let yzPos = this.getTouchYZPos(mouseEvent);
        return (xyPos.elements[1] + yzPos.elements[1]) / 2;
    }
}