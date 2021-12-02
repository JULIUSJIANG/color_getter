// 本地存取的键，变更的话，相当于刷新存档
const LOCAL_STORAGE_KEY = "data7";

namespace dataStorage {
    /**
     * 玩家数据
     */
    export interface PlayerData {
        /**
         * 当前正在编辑的光线列表
         */
        editLightList: LightData[]
    }

    /**
     * 光线数据
     */
    export interface LightData {
        /**
         * 位置 x
         */
        locPosX: number,
        /**
         * 位置 y
         */
        locPosY: number,
        /**
         * 角度
         */
        locAngle: number,
        /**
         * 光强度
         */
        lcPower: number
    }

    /**
     * 当前的玩家数据，相当于默认值
     */
    export let current: PlayerData = {
        editLightList: [
            {
                locPosX: -100,
                locPosY: 0,
                locAngle: 0,
                lcPower: 1
            },
            {
                locPosX: 100,
                locPosY: 0,
                locAngle: 0,
                lcPower: 1
            }
        ]
    }
}

export default dataStorage;

// 读取存档
let localSaved = localStorage.getItem( LOCAL_STORAGE_KEY );
// 确实有存数据
if (localSaved != null && localSaved != "") {
    dataStorage.current = JSON.parse(localSaved);
};
// 确保数据同步
cc.game.on(
    cc.game.EVENT_HIDE,
    () => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify( dataStorage.current ));
    }
);