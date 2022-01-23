import { createStore, Action } from 'redux';
import Eventer from '../lib/Eventer';
import ObjectPool from '../lib/object_pool/ObjectPool';
import config from './Config';
import BlockGridXRec from './struct/BlockGridXRec';
import State from './State';
import TouchMachine from './touchmachine/TouchMachine';

/**
 * 全局的数据中心
 */
namespace root {
    /**
     * 交互状态机
     */
    export const touchMachine = new TouchMachine();

    /**
     * 事务管理中心
     */
    class RootReducer {
        private _reduceMap: Map<number, (state: State, act: Action<any>) => State> = new Map();
        Regist<T> (type: number, reduce: (state: State, act: Action<T>) => State) {
            this._reduceMap.set(type, reduce);
        }
        Reduce (state: State, act: Action<any>) {
            if (!this._reduceMap.has(act.type)) {
                return state;
            };
            return this._reduceMap.get(act.type)(state, act);
        }
    };

    /**
     * 全局的事务处理器
     */
    const rootReducer = new RootReducer();

    /**
     * 全局的数据中心
     */
    export const store = createStore(rootReducer.Reduce.bind(rootReducer));

    /**
     * 事务标识生成器
     */
    let id = 0;

    /**
     * 事务处理器
     */
    class RootAction<T> {
        type: number;
        action: (state: State, eff: T) => State
        constructor(
            action: (state: State, eff: T) => State
        ) 
        {
            this.type = ++id;
            this.action = action;
            rootReducer.Regist(
                id,
                (state, act) => {
                    let result = action(state, (act as any).t);
                    return result;
                }
            );
        }

        /**
         * 获取业务请求
         * @param t 
         * @returns 
         */
        Eff (t: T = null) {
            store.dispatch({
                type: this.type,
                t: t
            });
        }
    }

    /**
     * 进行数据初始化
     */
     export const reducerInit = new RootAction<State> (
        (state, t) => {
            return t;
        }
    );
    
    /**
     * 卸载 webgl
     */
    export const reducerDisableWebgl = new RootAction (
        (state) => {
            return {
                ...state,
                disableWebgl: true
            };
        }
    );
    
    /**
     * 加载 webgl
     */
    export const reducerEnableWebgl = new RootAction (
        (state) => {
            return {
                ...state,
                disableWebgl: false
            };
        }
    );
    
    /**
     * 设置当前行为
     */
    export const reducerSetOp = new RootAction<number> (
        (state, op) => {
            return {
                ...state,
                opIndex: op
            };
        }
    );
    
    /**
     * 设置相机位置
     */
    export const reducerSetCameraPos = new RootAction<number[]>(
        (state, cameraPos) => {
            return {
                ...state,
                cameraX: cameraPos[0],
                cameraY: cameraPos[1],
                version: state.version + 1
            };
        }
    );
    
    /**
     * 设置聚焦的格子
     */
    export const reducerSetFocusGrid = new RootAction<number[]>(
        (state, cameraPos) => {
            return {
                ...state,
                focusGridX: cameraPos[0],
                focusGridY: cameraPos[1],
                version: state.version + 1
            };
        }
    );

    /**
     * 设置当前的按压状态
     */
    export const reducerSetPressed = new RootAction<boolean> (
        (state, isPressed) => {
            return {
                ...state,
                isPressed: isPressed,
                version: state.version + 1
            };
        }
    );

    /**
     * 添加方块
     */
    export const reducerAddBlock = new RootAction<number[]> (
        (state, gridLoc) => {
            let xRec = state.blockXRec.find((ele) => {
                return ele.gridX == gridLoc[0];
            });
            // 确保记录存在
            if (xRec == null) {
                xRec = {
                    gridX: gridLoc[0],
                    yCollect: []
                };
                state.blockXRec.push(xRec);
                state.blockXRec.sort(( recA, recB ) => {
                    return recA.gridX - recB.gridX
                });
            };
            let yRec = xRec.yCollect.find(( ele ) => {
                return ele.gridY == gridLoc[1];
            });
            // 位置上本来就有东西，忽略该次操作
            if (yRec != null) {
                return state;
            };
            yRec = {
                gridY: gridLoc[1]
            };
            xRec.yCollect.push(yRec);
            xRec.yCollect.sort((eleA, eleB) => {
                return eleA.gridY - eleB.gridY;
            });
            return {
                ...state,
                version: state.version + 1
            };
        }
    );

    /**
     * 移除方块
     */
    export const reducerRemBlock = new RootAction<number[]> (
        (state, gridLoc) => {
            let xRec = state.blockXRec.find((ele) => {
                return ele.gridX == gridLoc[0];
            });
            if (xRec == null) {
                return state;
            };
            let yRec = xRec.yCollect.find(( ele ) => {
                return ele.gridY == gridLoc[1];
            });
            // 位置上本来就有东西，忽略该次操作
            if (yRec == null) {
                return state;
            };
            xRec.yCollect.splice(xRec.yCollect.indexOf(yRec), 1);
            return {
                ...state,
                version: state.version + 1
            };
        }
    );

    /**
     * 添加光源
     */
     export const reducerAddLight = new RootAction<number[]> (
        (state, gridLoc) => {
            let xRec = state.lightXRec.find((ele) => {
                return ele.gridX == gridLoc[0];
            });
            // 确保记录存在
            if (xRec == null) {
                xRec = {
                    gridX: gridLoc[0],
                    yCollect: []
                };
                state.lightXRec.push(xRec);
                state.lightXRec.sort(( recA, recB ) => {
                    return recA.gridX - recB.gridX
                });
            };
            let yRec = xRec.yCollect.find(( ele ) => {
                return ele.gridY == gridLoc[1];
            });
            // 位置上本来就有东西，忽略该次操作
            if (yRec != null) {
                return state;
            };
            yRec = {
                gridY: gridLoc[1]
            };
            xRec.yCollect.push(yRec);
            xRec.yCollect.sort((eleA, eleB) => {
                return eleA.gridY - eleB.gridY;
            });
            return {
                ...state,
                version: state.version + 1
            };
        }
    );

    /**
     * 移除光源
     */
    export const reducerRemLight = new RootAction<number[]> (
        (state, gridLoc) => {
            let xRec = state.lightXRec.find((ele) => {
                return ele.gridX == gridLoc[0];
            });
            if (xRec == null) {
                return state;
            };
            let yRec = xRec.yCollect.find(( ele ) => {
                return ele.gridY == gridLoc[1];
            });
            // 位置上本来就有东西，忽略该次操作
            if (yRec == null) {
                return state;
            };
            xRec.yCollect.splice(xRec.yCollect.indexOf(yRec), 1);
            return {
                ...state,
                version: state.version + 1
            };
        }
    );

    /**
     * 设置绘制背景许可
     */
     export const reducerSetDrawBgGrid = new RootAction<boolean>(
        (state, val) => {
            return {
                ...state,
                drawBgGrid: val,
                version: state.version + 1
            };
        }
    );

    /**
     * 设置绘制方块许可
     */
     export const reducerSetDrawBlock = new RootAction<boolean>(
        (state, val) => {
            return {
                ...state,
                drawBlock: val,
                version: state.version + 1
            };
        }
    );

    /**
     * 设置绘制光点许可
     */
     export const reducerSetDrawLightPoint = new RootAction<boolean>(
        (state, val) => {
            return {
                ...state,
                drawLightPoint: val,
                version: state.version + 1
            };
        }
    );

    /**
     * 设置区域绘制许可
     */
    export const reducerSetDrawLightArea = new RootAction<boolean> (
        (state, val) => {
            return {
                ...state,
                drawLightArea: val,
                version: state.version + 1
            };
        }
    );

    /**
     * 设置渗透绘制许可
     */
    export const reducerSetDrawSeepData = new RootAction<boolean>(
        (state, val) => {
            return {
                ...state,
                drawSeepData: val,
                version: state.version + 1
            };
        }
    );

    /**
     * 设置打印渗透数据
     */
     export const reducerSetLogSeepData = new RootAction<boolean>(
        (state, val) => {
            return {
                ...state,
                logSeepData: val,
                version: state.version + 1
            };
        }
    );

    /**
     * 事件派发器-帧变化
     */
    export const evterFrame = new Eventer();

    /**
     * 获取当前的帧 id
     * @returns 
     */
    export function GetFrameId () {
        return frameId;
    }

    
    /**
     * 检查当前格子上方块是否为空
     * @returns 
     */
    export function CheckGridBlockEmpty (gridX: number, gridY: number) {
        let gridRec = root.store.getState().blockXRec.find((ele) => {
            return ele.gridX == gridX;
        });
        if (gridRec == null) {
            return true;
        };
        let yRec = gridRec.yCollect.find((ele) => {
            return ele.gridY == gridY;
        });
        if (yRec == null) {
            return true;
        };
        return false;
    }

    /**
     * 检查当前格子上光源是否为空
     * @returns 
     */
     export function CheckGridLightEmpty (gridX: number, gridY: number) {
        let gridRec = root.store.getState().lightXRec.find((ele) => {
            return ele.gridX == gridX;
        });
        if (gridRec == null) {
            return true;
        };
        let yRec = gridRec.yCollect.find((ele) => {
            return ele.gridY == gridY;
        });
        if (yRec == null) {
            return true;
        };
        return false;
    }
};

// 读取本地存储的数据
let storagedData = localStorage.getItem(config.storageKey);
// 初始化的状态
let initState: State;
// 如果没有存储过，那么创建为默认值
if (storagedData == null || storagedData == `` || storagedData == `undefined`) {
    initState = State.def;
}
// 否则采用存储值
else {
    initState = JSON.parse(storagedData);
    for (let key in State.def) {
        if ((initState as any)[key] == null) {
            (initState as any)[key] = (State.def as any)[key];
        };
    };
};
// 更正一些特殊的状态
initState.disableWebgl = false;
initState.isPressed = false;
// 进行状态初始化
root.reducerInit.Eff(initState);
// 每次页面销毁的时候，确保状态保存好
window.onunload = () => {
    localStorage.setItem(config.storageKey, JSON.stringify(root.store.getState()));
};
// 帧 id
let frameId = 0;
// 帧回调
function step () {
    frameId++;
    root.evterFrame.Call();
    window.requestAnimationFrame(step);
};
window.requestAnimationFrame(step);
window[`process`] = {} as any; 
window["root" as any] = root as any;
export default root;