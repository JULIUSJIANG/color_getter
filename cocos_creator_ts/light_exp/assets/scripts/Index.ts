// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import BlockIndex from "../libs/block/BlockIndex";
import BlockRay from "../libs/block/BlockRay";
import ObjectPool from "../libs/object_pool/ObjectPool";
import ObjectPoolType from "../libs/object_pool/ObjectPoolType";
import utilNode from "../libs/UtilNode";
import LightCtrl from "./LightCtrl";

const {ccclass, property} = cc._decorator;

// 本地存取的键
const LOCAL_STORAGE_KEY = "data6";

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

    /**
     * 对应对象池
     */
    _pool = new ObjectPool();

    public override onLoad () {
        let localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        // 确实有存数据
        if (localData != null && localData != "") {
            this.playerData = JSON.parse(localData);
        };

        // 创建数据核心
        this._blockIndex = new BlockIndex(
            this._pool,
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
                vec2.x,
                vec2.y
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
     * 水平向量
     */
    _horVec = new cc.Vec2();

    /**
     * 垂直向量
     */
    _verVec = new cc.Vec2();

    /**
     * 左下格子位置
     */
    _leftBottomPos = new cc.Vec2();

    /**
     * 右上格子位置
     */
    _rightTopPos = new cc.Vec2();

    /**
     * 经过的格子记录
     */
    _gridAbleMap: Map<number, number[]> = new Map();

    /**
     * 对应的类型
     */
    static _gridAbleMapListPoolType = new ObjectPoolType<number[]>(
        () => {
            return [];
        },
        (t) => {

        },
        (t) => {
            t.length = 0;
        }
    )

    _pos = new cc.Vec2();

    /**
     * 重新绘制
     */
    ReDraw () {
        this.graphics.clear();

        this._leftBottomPos.x = 0;
        this._leftBottomPos.y = 0;
        this.ParseTouchPosToContainerPos(this._leftBottomPos, this._leftBottomPos);
        this._leftBottomPos.x = this._blockIndex.GetGridLoc(this._leftBottomPos.x);
        this._leftBottomPos.y = this._blockIndex.GetGridLoc(this._leftBottomPos.y);

        this._rightTopPos.x = this.node.width;
        this._rightTopPos.y = this.node.height;
        this.ParseTouchPosToContainerPos(this._rightTopPos, this._rightTopPos);
        this._rightTopPos.x = this._blockIndex.GetGridLoc(this._rightTopPos.x);
        this._rightTopPos.y = this._blockIndex.GetGridLoc(this._rightTopPos.y);

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
            // 清空一遍
            this._gridAbleMap.forEach(( val ) => {
                this._pool.Push(Index._gridAbleMapListPoolType, val);
            });
            this._gridAbleMap.clear();

            // 添加格子记录
            let addGridRec = (gridx: number, gridY: number) => {
                // 确保集合存在
                if (!this._gridAbleMap.has(gridx)) {
                    this._gridAbleMap.set(gridx, this._pool.Pop(Index._gridAbleMapListPoolType));
                };
                // 确保记录下来
                if (this._gridAbleMap.get(gridx).indexOf(gridY) < 0) {
                    this._gridAbleMap.get(gridx).push(gridY);
                };
            };

            addGridRec(
                this._blockIndex.GetGridLoc(inst.pos.x),
                this._blockIndex.GetGridLoc(inst.pos.y)
            );

            this.graphics.moveTo(inst.pos.x, inst.pos.y);
            this.graphics.lineTo(inst.pos.x + inst.vec.x * this.node.height, inst.pos.y + inst.vec.y * this.node.height);
            this.graphics.stroke();

            this._horVec.x = inst.vec.x;
            this._horVec.y = 0;
            if (0 < this._horVec.len()) {
                let horHit = this._blockIndex.GetHorGridHitRev(inst.pos, inst.vec);
                inst.vec.mul(horHit, this._pos);
                this._pos.x += inst.pos.x + inst.vec.x * 0.0001;
                this._pos.y += inst.pos.y + inst.vec.y * 0.0001;
                // 每次推进的向量长度
                let unitRate = Math.abs( this._blockIndex.gridPixels / this._horVec.x );
                this._horVec.normalizeSelf();
                let currGridX = this._blockIndex.GetGridLoc(this._pos.x);
                let currGridY = this._blockIndex.GetGridLoc(this._pos.y);
                // 当前推进次数
                let unitCount = 0;
                // 是否已初始化
                let isInited = false;
                // 还在范围里面，继续推进
                while (
                    this._leftBottomPos.x <= currGridX
                    && currGridX <= this._rightTopPos.x
                    && this._leftBottomPos.y <= currGridY
                    && currGridY <= this._rightTopPos.y
                ) 
                {
                    // 为了过滤掉首个
                    if (isInited) {
                        addGridRec(currGridX, currGridY);
                    };
                    isInited = true;
                    
                    // 推进次数 +1
                    unitCount++;
                    currGridX += this._horVec.x;
                    currGridY = this._blockIndex.GetGridLoc( this._pos.y + inst.vec.y * unitRate * unitCount );
                };
            };

            this._verVec.x = 0;
            this._verVec.y = inst.vec.y;
            if (0 < this._verVec.len()) {
                let verHit = this._blockIndex.GetVerGridHitRev(inst.pos, inst.vec);
                inst.vec.mul(verHit, this._pos);
                this._pos.x += inst.pos.x + inst.vec.x * 0.0001;
                this._pos.y += inst.pos.y + inst.vec.y * 0.0001;
                // 每次推进的向量长度
                let unitRate = Math.abs( this._blockIndex.gridPixels / this._verVec.y);
                this._verVec.normalizeSelf();
                let currGridX = this._blockIndex.GetGridLoc(this._pos.x);
                let currGridY = this._blockIndex.GetGridLoc(this._pos.y);
                // 当前推进次数
                let unitCount = 0;
                // 是否已初始化
                let isInited = false;
                // 还在范围里面，继续推进
                while (
                    this._leftBottomPos.x <= currGridX
                    && currGridX <= this._rightTopPos.x
                    && this._leftBottomPos.y <= currGridY
                    && currGridY <= this._rightTopPos.y
                ) 
                {
                    // 为了过滤掉首个
                    if (isInited) {
                        addGridRec(currGridX, currGridY);
                    };
                    isInited = true;
                    
                    // 推进次数 +1
                    unitCount++;
                    currGridX = this._blockIndex.GetGridLoc( this._pos.x + inst.vec.x * unitRate * unitCount);
                    currGridY += this._verVec.y;
                };
            };
            
            this._gridAbleMap.forEach(( yArr, x ) => {
                yArr.forEach(( y ) => {
                    this.DrawGrid(x, y, cc.Color.RED);
                })
            });
        });
    }

    /**
     * 绘制格子
     * @param gridX 
     * @param gridY 
     */
    DrawGrid (gridX: number, gridY: number, color: cc.Color) {
        let top = (gridY + 0.5) * this._blockIndex.gridPixels;
        let right = (gridX + 0.5) * this._blockIndex.gridPixels;
        let bottom = (gridY - 0.5) * this._blockIndex.gridPixels;
        let left = (gridX - 0.5) * this._blockIndex.gridPixels;

        // 绘制方块
        this.graphics.lineWidth = 2;
        this.graphics.strokeColor = color;
        this.graphics.moveTo(left, bottom);
        this.graphics.lineTo(right, bottom);
        this.graphics.lineTo(right, top);
        this.graphics.lineTo(left, top);
        this.graphics.lineTo(left, bottom);
        this.graphics.stroke();
    }

    /**
     * 用于变换的矩阵
     */
    _mat: cc.Mat4 = new cc.Mat4();

    /**
     * 交互位置转换为容器位置
     * @param touchPos 
     */
    public ParseTouchPosToContainerPos (out: cc.Vec2, touchPos: cc.Vec2) {
        out.x = touchPos.x;
        out.y = touchPos.y;
        out.x -= this.node.width;
        out.y -= this.node.height;
        out.transformMat4(this.containerLightCtrl.getWorldMatrix(this._mat), out);
    }
}