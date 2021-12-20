import CuonVector3 from "../../lib/webgl/CuonVector3";
import root from "../Root";
import RootComponet from "../component/Main";
import config from "../Config";
import TouchStatus from "./TouchStatus";
import TouchStatusDragScene from "./TouchStatusDragScene";
import TouchStatusIdle from "./TouchStatusIdle";
import TouchStatusAddBlock from "./TouchStatusAddBlock";
import TouchStatusRemBlock from "./TouchStatusRemBlock";
import TouchStatusAddLight from "./TouchStatusAddLight";
import TouchStatusRemLight from "./TouchStatusRemLight";

/**
 * 交互状态机
 */
export default class TouchMachine {
    /**
     * 进行初始化
     */
    public ListenTouch (canvas: HTMLCanvasElement) {
        // 当前交互的 xy
        let screenPosX: number, screenPosY: number;

        // 交互事件已处理
        let onTouched = () => {
            refreshFocusGrid();
        };

        // 刷新交互的格子
        let refreshFocusGrid = () => {
            let worldX = root.store.getState().cameraX - window.innerWidth / 2 + screenPosX;
            let worldY = root.store.getState().cameraY - window.innerHeight / 2 + screenPosY;
            this.touchGridX = Math.floor(worldX / config.rectSize);
            this.touchGridY = Math.floor(worldY / config.rectSize);
            // 去重
            if (this.touchGridX == root.store.getState().focusGridX && this.touchGridY == root.store.getState().focusGridY) {
                return;
            };
            root.reducerSetFocusGrid.Eff([this.touchGridX, this.touchGridY]);
        };

        // 重新填充交互的起始位置
        let refillTouchStart = () => {
            root.reducerSetPressed.Eff(true);
            this.posStart.elements[0] = screenPosX;
            this.posStart.elements[1] = screenPosY;
        };
        // 重新填充交互的拖拽位置
        let refillTouchMove = () => {
            this.posMove.elements[0] = screenPosX;
            this.posMove.elements[1] = screenPosY;
        };
        // 重新填充交互的结束位置
        let refillTouchEnd = () => {
            root.reducerSetPressed.Eff(false);
            this.posEnd.elements[0] = screenPosX;
            this.posEnd.elements[1] = screenPosY;
        };

        // 通知按下
        let CallMouseDown = () => {
            this.currStatus.OnMouseDown();
            onTouched();
        };
        // 通知拖拽
        let CallMouseMove = () => {
            this.currStatus.OnMouseMove();
            onTouched();
        };
        // 通知抬起
        let CallMouseUp = () => {
            this.currStatus.OnMouseUP();
            onTouched();
        };

        // 通过触摸事件刷新交互的 xy
        let refreshXYByTouch = (evt: TouchEvent) => {
            if (evt.touches.length == 0) {
                return;
            };
            screenPosX = evt.touches[0].clientX;
            screenPosY = window.innerHeight - evt.touches[0].clientY;
        };
        canvas.ontouchstart = (evt: TouchEvent) => {
            refreshXYByTouch(evt);
            refillTouchStart();
            CallMouseDown();
        };
        canvas.ontouchmove = (evt: TouchEvent) => {
            refreshXYByTouch(evt);
            refillTouchMove();
            CallMouseMove();
        };
        canvas.ontouchend = (evt: TouchEvent) => {
            refreshXYByTouch(evt);
            refillTouchEnd();
            CallMouseUp();
        };
        canvas.ontouchcancel = (evt: TouchEvent) => {
            refreshXYByTouch(evt);
            refillTouchEnd();
            CallMouseUp();
        };

        // 通过鼠标事件刷新交互的 xy
        let refreshXYByMouse = (evt: MouseEvent) => {
            screenPosX = evt.x;
            screenPosY = window.innerHeight - evt.y;
            refreshFocusGrid();
        };
        canvas.onmousedown = (evt: MouseEvent) => {
            refreshXYByMouse(evt);
            refillTouchStart();
            CallMouseDown();
        };
        canvas.onmousemove = (evt: MouseEvent) => {
            refreshXYByMouse(evt);
            refillTouchMove();
            CallMouseMove();
        };
        canvas.onmouseup = (evt: MouseEvent) => {
            refreshXYByMouse(evt);
            refillTouchEnd();
            CallMouseUp();
        };
    }

    /**
     * 状态-待机
     */
    public statusIdle?: TouchStatusIdle;

    /**
     * 状态-场景拖拽
     */
    public statusDragScene?: TouchStatusDragScene;
    /**
     * 状态-放置方块
     */
    public statusAddBlock: TouchStatusAddBlock;
    /**
     * 状态-移除方块
     */
    public statusRemBlock: TouchStatusRemBlock;
    /**
     * 状态-添加光源
     */
    public statusAddLight: TouchStatusAddLight;
    /**
     * 状态-移除光源
     */
    public statusRemLight: TouchStatusRemLight;

    public constructor () {
        this.statusIdle = new TouchStatusIdle(this);
        this.statusDragScene = new TouchStatusDragScene(this);
        this.statusAddBlock = new TouchStatusAddBlock(this);
        this.statusRemBlock = new TouchStatusRemBlock(this);
        this.statusAddLight = new TouchStatusAddLight(this);
        this.statusRemLight = new TouchStatusRemLight(this);

        // 默认为待机状态
        this.SetStatus(this.statusIdle);
    }

    /**
     * 交互的起始位置
     */
    public posStart = new CuonVector3();
    /**
     * 交互的拖拽位置
     */
    public posMove = new CuonVector3();
    /**
     * 交互的结束位置
     */
    public posEnd = new CuonVector3();

    /**
     * 交互的格子 x
     */
    public touchGridX: number;
    /**
     * 交互的格子 y
     */
    public touchGridY: number;

    /**
     * 当前状态
     */
    public currStatus?: TouchStatus;

    /**
     * 设置当前状态
     * @param status 
     */
    public SetStatus (status: TouchStatus) {
        let currRec = this.currStatus;
        this.currStatus = status;
        // 通知退出
        if (currRec) {
            currRec.OnExit();
        };
        // 通知进入
        if (this.currStatus) {
            this.currStatus.OnEnter();
        };
    }
}