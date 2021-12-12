import CuonVector3 from "../../lib/webgl/CuonVector3";
import root from "../Root";
import RootComponet from "../Main";
import config from "../Config";
import TouchStatus from "./TouchStatus";
import TouchStatusDragScene from "./TouchStatusDragScene";
import TouchStatusIdle from "./TouchStatusIdle";

/**
 * 交互状态机
 */
export default class TouchMachine {
    /**
     * 进行初始化
     */
    public ListenTouch (canvas: HTMLCanvasElement) {
        // 当前交互的 xy
        let x: number, y: number;

        // 交互事件已处理
        let onTouched = () => {
            refreshFocusGrid();
        };

        // 刷新交互的格子
        function refreshFocusGrid () {
            let worldX = root.store.getState().cameraX - window.innerWidth / 2 + x;
            let worldY = root.store.getState().cameraY - window.innerHeight / 2 + y;
            let currGridX = Math.floor(worldX / config.rectSize);
            let currGridY = Math.floor(worldY / config.rectSize);
            // 去重
            if (currGridX == root.store.getState().focusGridX && currGridY == root.store.getState().focusGridY) {
                return;
            };
            root.reducerSetFocusGrid.Eff([Math.floor(worldX / config.rectSize), Math.floor(worldY / config.rectSize)]);
        };

        // 重新填充交互的起始位置
        let refillTouchStart = () => {
            root.reducerSetPressed.Eff(true);
            this.posStart.elements[0] = x;
            this.posStart.elements[1] = y;
        };
        // 重新填充交互的拖拽位置
        let refillTouchMove = () => {
            this.posMove.elements[0] = x;
            this.posMove.elements[1] = y;
        };
        // 重新填充交互的结束位置
        let refillTouchEnd = () => {
            root.reducerSetPressed.Eff(false);
            this.posEnd.elements[0] = x;
            this.posEnd.elements[1] = y;
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
            x = evt.touches[0].clientX;
            y = window.innerHeight - evt.touches[0].clientY;
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
            x = evt.x;
            y = window.innerHeight - evt.y;
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

    public constructor () {
        this.statusIdle = new TouchStatusIdle(this);
        this.statusDragScene = new TouchStatusDragScene(this);

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