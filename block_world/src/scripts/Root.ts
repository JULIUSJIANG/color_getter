import { createStore, Action } from 'redux';
import config from './Config';
import TouchMachine from './touchmachine/TouchMachine';

/**
 * 全局的数据中心
 */
namespace root {

    export const touchMachine = new TouchMachine();

    /**
     * 全局数据结构
     */
    export class State {
        /**
         * 当前的操作类型
         */
        opIndex: number;

        /**
         * 相机位置 x
         */
        cameraX: number;

        /**
         * 相机位置 y
         */
        cameraY: number;

        /**
         * 关闭 webgl
         */
        disableWebgl: boolean;

        /**
         * 聚焦的格子 x
         */
        focusGridX: number;

        /**
         * 聚焦的格子 y
         */
        focusGridY: number;

        /**
         * 当前处于按压状态
         */
        isPressed: boolean;
    };

    /**
     * 默认数据
     */
    export const def: State = {
        opIndex: 0,
        cameraX: 0,
        cameraY: 0,
        disableWebgl: false,
        focusGridX: 0,
        focusGridY: 0,
        isPressed: false
    };

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
                cameraY: cameraPos[1]
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
                focusGridY: cameraPos[1]
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
                isPressed: isPressed
            };
        }
    )
};

// 读取本地存储的数据
let storagedData = localStorage.getItem(config.storageKey);
// 初始化的状态
let initState: root.State;
// 如果没有存储过，那么创建为默认值
if (storagedData == null || storagedData == `` || storagedData == `undefined`) {
    initState = root.def;
}
// 否则采用存储值
else {
    initState = JSON.parse(storagedData)
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
export default root;