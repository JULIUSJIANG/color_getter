// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import BlockIndex from "../libs/block/BlockIndex";
import ObjectPool from "../libs/object_pool/ObjectPool";
import LightCtrl from "./LightCtrl";

const {ccclass, property} = cc._decorator;

// 本地存取的键
const LOCAL_STORAGE_KEY = "data2";

@ccclass
export default class Index extends cc.Component {
    /**
     * 用户数据
     */
    public playerData = {
        /**
         * 位置 x
         */
        lcPosX: 0,
        /**
         * 位置 Y
         */
        lcPosY: 0,
        /**
         * 角度
         */
        lcAngle: 0,
        /**
         * 光强度
         */
        lcPower: 1
    }

    /**
     * 画笔内容
     */
    @property(cc.Graphics)
    public graphics: cc.Graphics = null;

    /**
     * 光线控制器的预制体
     */
    @property(cc.Prefab)
    public prefabLightCtrl: cc.Prefab = null;

    /**
     * 用于放置光线控制器的容器
     */
    @property(cc.Node)
    public containerLightCtrl: cc.Node = null;

    /**
     * 数据核心
     */
    private _blockIndex: BlockIndex;

    public override onLoad () {
        let localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        // 确实有存数据
        if (localData != null && localData != "") {
            this.playerData = JSON.parse(localData);
        };

        this._blockIndex = new BlockIndex(
            new ObjectPool()
        );
        this._blockIndex.refRectangle.Create(
            -100,
            -50,
            200,
            100
        );

        let lightCtrl = cc.instantiate(this.prefabLightCtrl).getComponent(LightCtrl);
        this.containerLightCtrl.addChild(lightCtrl.node);
        lightCtrl.Init(this);
        lightCtrl.node.x = this.playerData.lcPosX;
        lightCtrl.node.y = this.playerData.lcPosY;
        lightCtrl.node.angle = this.playerData.lcAngle;
        lightCtrl.dragPower.y = lightCtrl.powerMin + (lightCtrl.powerMax - lightCtrl.powerMin) * this.playerData.lcPower;
        
        // 及时保存数据
        cc.game.on(cc.game.EVENT_HIDE, () => {
            this.playerData.lcPosX = lightCtrl.node.x;
            this.playerData.lcPosY = lightCtrl.node.y;
            this.playerData.lcAngle = lightCtrl.node.angle;
            this.playerData.lcPower = (lightCtrl.dragPower.y - lightCtrl.powerMin) / (lightCtrl.powerMax - lightCtrl.powerMin);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.playerData))
        });
    }

    /**
     * 更新
     */
    public update () {
        this.graphics.clear();
        this.graphics.lineWidth = 2;
        this.graphics.strokeColor = cc.Color.WHITE;
        this._blockIndex.refRectangle.Exec(( inst ) => {
            this.graphics.moveTo(inst.rect.x, inst.rect.y);
            this.graphics.lineTo(inst.rect.x + inst.rect.width, inst.rect.y);
            this.graphics.lineTo(inst.rect.x + inst.rect.width, inst.rect.y + inst.rect.height);
            this.graphics.lineTo(inst.rect.x, inst.rect.y + inst.rect.height);
            this.graphics.lineTo(inst.rect.x, inst.rect.y);
            this.graphics.stroke();
        });
    }
}