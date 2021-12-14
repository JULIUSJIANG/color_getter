import root from "../Root";
import TouchStatus from "./TouchStatus";

/**
 * 交互状态-放置光源
 */
export default class TouchStatusAddLight extends TouchStatus {
    public override OnEnter () {
        this.OnMouseMove();
    }

    public override OnMouseMove() {
        // 当前交互的格子不可用
        if (!this.CheckGridLightEmpty()) {
            return;
        };
        // 添加光源
        root.reducerAddLight.Eff([this.machine.touchGridX, this.machine.touchGridY]);
    }

    public override OnMouseUP (): void {
        // 回到拖拽状态
        this.machine.SetStatus(this.machine.statusIdle);
    }
}