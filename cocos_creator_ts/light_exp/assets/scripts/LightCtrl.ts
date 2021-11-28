import Eventer from "../libs/Eventer";
import utilNode from "../libs/UtilNode";
import Index from "./Index";

const {ccclass, property} = cc._decorator;

/**
 * 光线控制器
 */
@ccclass
export default class LightCtrl extends cc.Component {
    /**
     * 事件派发器-发生变化
     */
    public evterOnChanged = new Eventer();

    /**
     * 用于位置编辑的节点
     */
    @property(cc.Node)
    public dragPos: cc.Node = null;

    /**
     * 用于角度编辑的节点
     */
    @property(cc.Node)
    public dragAngle: cc.Node = null;

    /**
     * 用于调整颜色强度
     */
    @property(cc.Node)
    public dragPower: cc.Node = null;

    /**
     * 根界面
     */
    public relIndex: Index;

    /**
     * 最低能量
     */
    public powerMin: number;

    /**
     * 最大能量
     */
    public powerMax: number;

    public onLoad () {
        // 对位置进行约束
        this.powerMin = this.dragPos.height / 2 + this.dragPower.height / 2;
        this.powerMax = this.dragAngle.y - this.dragAngle.height / 2 - this.dragPower.height / 2;
    }

    /**
     * 进行初始化
     * @param index 
     */
    public Init (index: Index) {
        this.relIndex = index;
        // 交互的起始位置
        let touchStartPos = new cc.Vec2();
        // 交互的拖拽位置
        let touchMovePos = new cc.Vec2();
        // 交互的结束位置
        let touchEndPos = new cc.Vec2();

        // 位置
        this.dragPos.on(cc.Node.EventType.TOUCH_START, (evt: cc.Event.EventTouch) => {
            this.ParseTouchPosToContainerPos(touchStartPos, evt.getLocation());
            let onTouchMove = (evt: cc.Event.EventTouch) => {
                this.ParseTouchPosToContainerPos(touchMovePos, evt.getLocation());
                // 实现拖拽
                this.node.x = touchMovePos.x;
                this.node.y = touchMovePos.y;
                this.evterOnChanged.Call();
            };
            this.dragPos.parent.on(cc.Node.EventType.TOUCH_MOVE, onTouchMove);
            let onTouchEnd = (evt: cc.Event.EventTouch) => {
                this.ParseTouchPosToContainerPos(touchEndPos, evt.getLocation());
                this.dragPos.parent.off(cc.Node.EventType.TOUCH_MOVE, onTouchMove);
                this.dragPos.parent.off(cc.Node.EventType.TOUCH_END, onTouchEnd);
                this.dragPos.parent.off(cc.Node.EventType.TOUCH_CANCEL, onTouchEnd);
            };
            this.dragPos.parent.on(cc.Node.EventType.TOUCH_END, onTouchEnd);
            this.dragPos.parent.on(cc.Node.EventType.TOUCH_CANCEL, onTouchEnd);
        });

        // 相对位置
        let touchMoveRelPos = new cc.Vec2();
        // 角度
        this.dragAngle.on(cc.Node.EventType.TOUCH_START, (evt: cc.Event.EventTouch) => {
            this.ParseTouchPosToContainerPos(touchStartPos, evt.getLocation());
            let onTouchMove = (evt: cc.Event.EventTouch) => {
                this.ParseTouchPosToContainerPos(touchMovePos, evt.getLocation());
                // 实现拖拽
                touchMoveRelPos.x = touchMovePos.x - this.node.x;
                touchMoveRelPos.y = touchMovePos.y - this.node.y;
                this.node.angle = utilNode.ParseVec2ToCCAngle(touchMoveRelPos);
                this.evterOnChanged.Call();
            };
            this.dragAngle.parent.on(cc.Node.EventType.TOUCH_MOVE, onTouchMove);
            let onTouchEnd = (evt: cc.Event.EventTouch) => {
                this.ParseTouchPosToContainerPos(touchEndPos, evt.getLocation());
                this.dragAngle.parent.off(cc.Node.EventType.TOUCH_MOVE, onTouchMove);
                this.dragAngle.parent.off(cc.Node.EventType.TOUCH_END, onTouchEnd);
                this.dragAngle.parent.off(cc.Node.EventType.TOUCH_CANCEL, onTouchEnd);
            };
            this.dragAngle.parent.on(cc.Node.EventType.TOUCH_END, onTouchEnd);
            this.dragAngle.parent.on(cc.Node.EventType.TOUCH_CANCEL, onTouchEnd);
        });

        // 当前指向的位置
        let currNodeVec2 = new cc.Vec2();
        // 强度
        this.dragPower.on(cc.Node.EventType.TOUCH_START, (evt: cc.Event.EventTouch) => {
            this.ParseTouchPosToContainerPos(touchStartPos, evt.getLocation());
            utilNode.ParseAngleToVec2(currNodeVec2, this.node.angle);
            let onTouchMove = (evt: cc.Event.EventTouch) => {
                this.ParseTouchPosToContainerPos(touchMovePos, evt.getLocation());
                // 实现拖拽
                touchMoveRelPos.x = touchMovePos.x - this.node.x;
                touchMoveRelPos.y = touchMovePos.y - this.node.y;
                let power = cc.Vec2.dot(currNodeVec2, touchMoveRelPos);
                power = Math.max(this.powerMin, power);
                power = Math.min(this.powerMax, power);
                this.dragPower.y = power;
                this.evterOnChanged.Call();
            };
            this.dragPower.parent.on(cc.Node.EventType.TOUCH_MOVE, onTouchMove);
            let onTouchEnd = (evt: cc.Event.EventTouch) => {
                this.ParseTouchPosToContainerPos(touchEndPos, evt.getLocation());
                this.dragPower.parent.off(cc.Node.EventType.TOUCH_MOVE, onTouchMove);
                this.dragPower.parent.off(cc.Node.EventType.TOUCH_END, onTouchEnd);
                this.dragPower.parent.off(cc.Node.EventType.TOUCH_CANCEL, onTouchEnd);
            };
            this.dragPower.parent.on(cc.Node.EventType.TOUCH_END, onTouchEnd);
            this.dragPower.parent.on(cc.Node.EventType.TOUCH_CANCEL, onTouchEnd);
        });
    }

    /**
     * 用于变换的矩阵
     */
    private _mat: cc.Mat4 = new cc.Mat4();

    /**
     * 交互位置转换为容器位置
     * @param touchPos 
     */
    private ParseTouchPosToContainerPos (out: cc.Vec2, touchPos: cc.Vec2) {
        out.x = touchPos.x;
        out.y = touchPos.y;
        out.x -= this.relIndex.node.width;
        out.y -= this.relIndex.node.height;
        out.transformMat4(this.relIndex.containerLightCtrl.getWorldMatrix(this._mat), out);
    }

    /**
     * 获取强度
     * @returns 
     */
    public GetPower () {
        return (this.dragPower.y - this.powerMin) / (this.powerMax - this.powerMin);
    }
}