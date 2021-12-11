import CuonVector3 from "../../lib/webgl/CuonVector3";
import TouchStatus from "./TouchStatus";
import TouchStatusDragScene from "./TouchStatusDragScene";
import TouchStatusIdle from "./TouchStatusIdle";

/**
 * 交互状态机
 */
export default class TouchMachine {
    /**
     * 全局的唯一实例
     */
    private static inst: TouchMachine;

    /**
     * 进行初始化
     */
    public static Init (canvas: HTMLCanvasElement) {
        // 确保状态机存在
        if (TouchMachine.inst == null) {
            TouchMachine.inst = new TouchMachine();
        };

        // 当前交互的 xy
        let x: number, y: number;

        // 通过触摸事件刷新交互的 xy
        function refreshXYByTouch (evt: TouchEvent) {
            if (evt.touches.length == 0) {
                return;
            };
            x = evt.touches[0].clientX;
            y = window.innerHeight - evt.touches[0].clientY;
        };
        // 重新填充交互的起始位置
        function refillTouchStart () {
            TouchMachine.inst.posStart.elements[0] = x;
            TouchMachine.inst.posStart.elements[1] = y;
        };
        // 重新填充交互的拖拽位置
        function refillTouchMove () {
            TouchMachine.inst.posMove.elements[0] = x;
            TouchMachine.inst.posMove.elements[1] = y;
        };
        // 重新填充交互的结束位置
        function refillTouchEnd () {
            TouchMachine.inst.posEnd.elements[0] = x;
            TouchMachine.inst.posEnd.elements[1] = y;
        };
        canvas.ontouchstart = (evt: TouchEvent) => {
            refreshXYByTouch(evt);
            refillTouchStart();
            this.inst.currStatus.OnMouseDown();
        };
        canvas.ontouchmove = (evt: TouchEvent) => {
            refreshXYByTouch(evt);
            refillTouchMove();
            this.inst.currStatus.OnMouseMove();
        };
        canvas.ontouchend = (evt: TouchEvent) => {
            refreshXYByTouch(evt);
            refillTouchEnd();
            this.inst.currStatus.OnMouseUP();
        };
        canvas.ontouchcancel = (evt: TouchEvent) => {
            refreshXYByTouch(evt);
            refillTouchEnd();
            this.inst.currStatus.OnMouseUP();
        };

        // 通过鼠标事件刷新交互的 xy
        function refreshXYByMouse (evt: MouseEvent) {
            x = evt.x;
            y = window.innerHeight - evt.y;
        };
        canvas.onmousedown = (evt: MouseEvent) => {
            refreshXYByMouse(evt);
            refillTouchStart();
            this.inst.currStatus.OnMouseDown();
        };
        canvas.onmousemove = (evt: MouseEvent) => {
            refreshXYByMouse(evt);
            refillTouchMove();
            this.inst.currStatus.OnMouseMove();
        };
        canvas.onmouseup = (evt: MouseEvent) => {
            refreshXYByMouse(evt);
            refillTouchEnd();
            this.inst.currStatus.OnMouseUP();
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

    private constructor () {
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