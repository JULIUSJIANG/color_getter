// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import BlockIndex from "../libs/block/BlockIndex";
import BlockRay from "../libs/block/BlockRay";
import ObjectPool from "../libs/object_pool/ObjectPool";
import utilNode from "../libs/UtilNode";
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

        // 创建数据核心
        this._blockIndex = new BlockIndex(
            new ObjectPool(),
            100
        );

        // 创建块
        this._blockIndex.refRectangle.Create(
            0,
            0
        );

        // 光束控制器
        let lightCtrl = cc.instantiate(this.prefabLightCtrl).getComponent(LightCtrl);
        this.containerLightCtrl.addChild(lightCtrl.node);
        lightCtrl.Init(this);
        lightCtrl.node.x = this.playerData.lcPosX;
        lightCtrl.node.y = this.playerData.lcPosY;
        lightCtrl.node.angle = this.playerData.lcAngle;
        lightCtrl.dragPower.y = lightCtrl.powerMin + (lightCtrl.powerMax - lightCtrl.powerMin) * this.playerData.lcPower;
        
        let blockRay = this._blockIndex.refRay.Create();
        let vec2 = new cc.Vec2();
        lightCtrl.evterOnChanged.On(() => {
            utilNode.ParseAngleToVec2(vec2, lightCtrl.node.angle + 180);
            this._blockIndex.refRay.Op(
                blockRay,
                BlockRay.ReFill,
                lightCtrl.node.x,
                lightCtrl.node.y,
                vec2.x * lightCtrl.GetPower(),
                vec2.y * lightCtrl.GetPower()
            );
            this.ReDraw();
        });

        // 通知变化
        lightCtrl.evterOnChanged.Call();
        
        // 及时保存数据
        cc.game.on(cc.game.EVENT_HIDE, () => {
            this.playerData.lcPosX = lightCtrl.node.x;
            this.playerData.lcPosY = lightCtrl.node.y;
            this.playerData.lcAngle = lightCtrl.node.angle;
            this.playerData.lcPower = lightCtrl.GetPower();
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.playerData))
        });
    }

    /**
     * 重新绘制
     */
    ReDraw () {
        this.graphics.clear();

        // 绘制方块
        this.graphics.lineWidth = 2;
        this.graphics.strokeColor = cc.Color.WHITE;
        this._blockIndex.refRectangle.Exec(( inst ) => {
            this.graphics.moveTo(inst.left, inst.bottom);
            this.graphics.lineTo(inst.right, inst.bottom);
            this.graphics.lineTo(inst.right, inst.top);
            this.graphics.lineTo(inst.left, inst.top);
            this.graphics.lineTo(inst.left, inst.bottom);
            this.graphics.stroke();
        });

        // 绘制射线
        this.graphics.strokeColor = cc.Color.RED;
        this._blockIndex.refRay.Exec(( inst ) => {
            this.graphics.moveTo(inst.pos.x, inst.pos.y);
            this.graphics.lineTo(inst.pos.x + inst.power.x * this._blockIndex.gridPixels, inst.pos.y + inst.power.y * this._blockIndex.gridPixels);
            this.graphics.stroke();
        });
    }
}