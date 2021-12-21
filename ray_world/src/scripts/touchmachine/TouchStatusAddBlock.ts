import root from "../Root";
import TouchStatus from "./TouchStatus";

/**
 * 交互状态-放置方块
 */
export default class TouchStatusAddBlock extends TouchStatus {
    public override OnEnter(): void {
        this.OnMouseMove();
    };

    public override OnMouseMove(): void {
        // 当前交互的格子位不可用
        if (!root.CheckGridBlockEmpty(this.machine.touchGridX, this.machine.touchGridY)) {
            return;
        };
        // 添加格子
        root.reducerAddBlock.Eff([this.machine.touchGridX, this.machine.touchGridY])
    }

    public override OnMouseUP(): void {
        // 回到拖拽状态
        this.machine.SetStatus(this.machine.statusIdle);
    }
}