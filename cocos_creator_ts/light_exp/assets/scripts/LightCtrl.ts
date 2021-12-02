import BlockRay from "../libs/block/BlockRay";
import Eventer from "../libs/Eventer";
import utilNode from "../libs/UtilNode";
import dataStorage from "./DataStorage";
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
    public Init (index: Index, i: number) {
        this.relIndex = index;
        // 交互的起始位置
        let touchStartPos = new cc.Vec2();
        // 交互的拖拽位置
        let touchMovePos = new cc.Vec2();
        // 交互的结束位置
        let touchEndPos = new cc.Vec2();

        // 位置
        this.dragPos.on(cc.Node.EventType.TOUCH_START, (evt: cc.Event.EventTouch) => {
            this.relIndex.ParseTouchPosToContainerPos(touchStartPos, evt.getLocation());
            let onTouchMove = (evt: cc.Event.EventTouch) => {
                this.relIndex.ParseTouchPosToContainerPos(touchMovePos, evt.getLocation());
                // 实现拖拽
                this.node.x = touchMovePos.x;
                this.node.y = touchMovePos.y;
                this.evterOnChanged.Call();
            };
            this.dragPos.parent.on(cc.Node.EventType.TOUCH_MOVE, onTouchMove);
            let onTouchEnd = (evt: cc.Event.EventTouch) => {
                this.relIndex.ParseTouchPosToContainerPos(touchEndPos, evt.getLocation());
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
            this.relIndex.ParseTouchPosToContainerPos(touchStartPos, evt.getLocation());
            let onTouchMove = (evt: cc.Event.EventTouch) => {
                this.relIndex.ParseTouchPosToContainerPos(touchMovePos, evt.getLocation());
                // 实现拖拽
                touchMoveRelPos.x = touchMovePos.x - this.node.x;
                touchMoveRelPos.y = touchMovePos.y - this.node.y;
                this.node.angle = utilNode.ParseVec2ToCCAngle(touchMoveRelPos);
                this.evterOnChanged.Call();
            };
            this.dragAngle.parent.on(cc.Node.EventType.TOUCH_MOVE, onTouchMove);
            let onTouchEnd = (evt: cc.Event.EventTouch) => {
                this.relIndex.ParseTouchPosToContainerPos(touchEndPos, evt.getLocation());
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
            this.relIndex.ParseTouchPosToContainerPos(touchStartPos, evt.getLocation());
            utilNode.ParseAngleToVec2(currNodeVec2, this.node.angle);
            let onTouchMove = (evt: cc.Event.EventTouch) => {
                this.relIndex.ParseTouchPosToContainerPos(touchMovePos, evt.getLocation());
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
                this.relIndex.ParseTouchPosToContainerPos(touchEndPos, evt.getLocation());
                this.dragPower.parent.off(cc.Node.EventType.TOUCH_MOVE, onTouchMove);
                this.dragPower.parent.off(cc.Node.EventType.TOUCH_END, onTouchEnd);
                this.dragPower.parent.off(cc.Node.EventType.TOUCH_CANCEL, onTouchEnd);
            };
            this.dragPower.parent.on(cc.Node.EventType.TOUCH_END, onTouchEnd);
            this.dragPower.parent.on(cc.Node.EventType.TOUCH_CANCEL, onTouchEnd);
        });

        let targetData = dataStorage.current.editLightList[i];
        this.node.x = targetData.locPosX;
        this.node.y = targetData.locPosY;
        this.node.angle = targetData.locAngle;
        this.dragPower.y = this.powerMin + (this.powerMax - this.powerMin) * targetData.lcPower;

        this.evterOnChanged.On(() => {
            targetData.locPosX = this.node.x;
            targetData.locPosY = this.node.y;
            targetData.locAngle = this.node.angle;
            targetData.lcPower = this.GetPower();
        });

        let blockRay = index._blockIndex.refRay.Create();
        let vec2 = new cc.Vec2();
        this.evterOnChanged.On(() => {
            utilNode.ParseAngleToVec2(vec2, this.node.angle + 180);
            index._blockIndex.refRay.Op(
                blockRay,
                BlockRay.ReFill,
                this.node.x,
                this.node.y,
                vec2.x,
                vec2.y
            );
            index.ReDraw();
        });

        this.evterOnChanged.Call();
    }

    /**
     * 获取强度
     * @returns 
     */
    public GetPower () {
        return (this.dragPower.y - this.powerMin) / (this.powerMax - this.powerMin);
    }
}