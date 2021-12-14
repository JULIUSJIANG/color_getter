import root from "../Root";
import TouchStatus from "./TouchStatus";

/**
 * 交互状态-移除方块
 */
export default class TouchStatusRemBlock extends TouchStatus {
    public override OnEnter(): void {
        this.OnMouseMove();
    };

    public override OnMouseMove(): void {
        // 当前交互的格子位不可用
        if (this.CheckGridBlockEmpty()) {
            return;
        };
        // 移除格子
        root.reducerRemBlock.Eff([this.machine.touchGridX, this.machine.touchGridY])
    }

    public override OnMouseUP(): void {
        // 回到拖拽状态
        this.machine.SetStatus(this.machine.statusIdle);
    }
}