import globalConfig from "../GlobalConfig";
import { GlobalState } from "../GlobalState";
import TouchMachineState from "./TouchMachineState";

/**
 * 交互状态-单纯的鼠标滑过
 */
export default class TouchMachineStateHover extends TouchMachineState {
    public override onMouseHover (mouseEvent: MouseEvent) {
        let state: GlobalState = {
            ...this.machine.colorGetter.state,
            xEnable: false,
            yEnable: false,
            zEnable: false
        };

        let touchLocation = this.getTouchCanvasPos(mouseEvent);
        if (0 <= touchLocation[0] && touchLocation[0] <= globalConfig.CANVAS_SIZE && 0 <= touchLocation[1] && touchLocation[1] <= globalConfig.CANVAS_SIZE) {
            // 清空颜色缓冲区和深度缓冲区
            this.machine.colorGetter.gl.clear(this.machine.colorGetter.gl.COLOR_BUFFER_BIT | this.machine.colorGetter.gl.DEPTH_BUFFER_BIT);

            // 绘制后面
            this.machine.colorGetter.drawByElementData(this.machine.colorGetter.dragCubeMvpMatrix, this.machine.colorGetter.hitTestVerticesColorsZ, this.machine.colorGetter.hitTestIndices, this.machine.colorGetter.gl.TRIANGLES);

            // 绘制绿面
            this.machine.colorGetter.drawByElementData(this.machine.colorGetter.dragCubeMvpMatrix, this.machine.colorGetter.hitTestVerticesColorsY, this.machine.colorGetter.hitTestIndices, this.machine.colorGetter.gl.TRIANGLES);

            // 绘制蓝面
            this.machine.colorGetter.drawByElementData(this.machine.colorGetter.dragCubeMvpMatrix, this.machine.colorGetter.hitTestVerticesColorsX, this.machine.colorGetter.hitTestIndices, this.machine.colorGetter.gl.TRIANGLES);

            // 碰撞检测
            this.machine.colorGetter.gl.readPixels(touchLocation[0], touchLocation[1], 1, 1, this.machine.colorGetter.gl.RGBA, this.machine.colorGetter.gl.UNSIGNED_BYTE, this.machine.colorGetter.pixels);
            if (this.machine.colorGetter.pixels[0] === 255) {
                state.xEnable = true;
            };
            if (this.machine.colorGetter.pixels[1] === 255) {
                state.yEnable = true;
            };
            if (this.machine.colorGetter.pixels[2] === 255) {
                state.zEnable = true;
            };
        };
        this.machine.colorGetter.setState(state);
    }

    public override onMouseDown (mouseEvent: MouseEvent) {
        if (this.machine.colorGetter.state.xEnable) {
            this.machine.enter(this.machine.stateDragX);
            this.machine.currState.onMouseDown(mouseEvent);
        };
        if (this.machine.colorGetter.state.yEnable) {
            this.machine.enter(this.machine.stateDragY);
            this.machine.currState.onMouseDown(mouseEvent);
        };
        if (this.machine.colorGetter.state.zEnable) {
            this.machine.enter(this.machine.stateDragZ);
            this.machine.currState.onMouseDown(mouseEvent);
        };
    }
}