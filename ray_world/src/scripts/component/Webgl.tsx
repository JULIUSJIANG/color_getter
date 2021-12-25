import React from "react";
import CuonMatrix4 from "../../lib/webgl/CuonMatrix4";
import cuonUtils from "../../lib/webgl/CuonUtils";
import config from "../Config";
import colorFragment from "../shader/ColorFragment";
import colorVertex from "../shader/ColorVertex";
import {connect} from 'react-redux';
import root from "../Root";
import CuonVector3 from "../../lib/webgl/CuonVector3";
import perfAnalyse from "../../lib/perf_analyse/PerfAnalyse";
import ObjectPoolType from "../../lib/object_pool/ObjectPoolType";
import LightRange from "../struct/LightRange";
import ObjectPool from "../../lib/object_pool/ObjectPool";
import BlockPos from "../struct/BlockPos";

/**
 * 绘制-主内容
 */
class Component extends React.Component {
    /**
     * 画布
     */
    public canvas: HTMLCanvasElement;

    /**
     * webgl 上下文
     */
    public gl: WebGLRenderingContext;

    /**
     * 着色程序
     */
    public program: WebGLProgram;

    /**
     * 顶点数据缓冲区
     */
    public vbuffer: WebGLBuffer;

    /**
     * 绘制点的缓冲区
     */
    public iBuffer: WebGLBuffer;

    /**
     * 内存位置-顶点坐标
     */
    public attlocPos: GLint;

    /**
     * 内存位置-顶点颜色
     */
    public attlocColor: GLint;

    /**
     * 内存位置-mvp 矩阵
     */
    public attlocMvpMat: WebGLUniformLocation;

    public constructor (props: {}) {
        super (props);
        this._drawFrameFuncList.push(
            this.DrawFrameLeft.bind(this),
            this.DrawFrameRight.bind(this),
            this.DrawFrameBottom.bind(this),
            this.DrawFrameTop.bind(this)
        );
    }

    /**
     * 用于监听帧的 id
     */
    private _frameListenId: number;

    public override componentDidMount () {
        this._frameListenId = root.evterFrame.On(() => {
            this.RefreshAll();
        });
    }

    public override componentWillUnmount() {
        root.evterFrame.Off(this._frameListenId);
    }

    /**
     * 变换矩阵的实例
     */
    private _vpMatrix = new CuonMatrix4();

    /**
     * 上一次进行绘制的版本 id
     */
    private _currDrawVersionId: number;

    /**
     * 刷新画面的全部
     * @returns 
     */
    public RefreshAll () {
        if (this.canvas == null) {
            return;
        };
        // 这个版本的数据已经绘制过了的话，忽略掉
        if (this._currDrawVersionId == root.store.getState().version) {
            return;
        };
        this._currDrawVersionId = root.store.getState().version;

        perfAnalyse.Rec(`Prepare`);
        // 进行绘制
        this.gl.clear(WebGLRenderingContext.COLOR_BUFFER_BIT | WebGLRenderingContext.DEPTH_BUFFER_BIT);
        // 设置为看向屏幕涉猎的所有地方
        this._vpMatrix.setOrtho(
            -window.innerWidth / 2,
            window.innerWidth / 2,
            -window.innerHeight / 2,
            window.innerHeight / 2,
            0,
            2
        );
        // 设置为看向原点
        this._vpMatrix.lookAt(
            0, 0, 1,
            0, 0, 0,
            0, 1, 0
        );
        // 设置偏移
        this._vpMatrix.translate(
            -root.store.getState().cameraX,
            -root.store.getState().cameraY,
            0
        );
        perfAnalyse.Rec(`DrawBgGrid`);
        this.DrawBgGrid();
        perfAnalyse.Rec(`DrawBlock`);
        this.DrawBlock();
        perfAnalyse.Rec(`DrawLightArea`);
        this.DrawLightArea();
        perfAnalyse.Rec(`DrawLightPoint`);
        this.DrawLightPoint();
        perfAnalyse.Rec(`DrawTouch`);
        this.DrawTouch();
        perfAnalyse.Rec(`End`);
        perfAnalyse.Catch();
    }

    /**
     * 顶点数据集
     */
    vertexNumberData: number[] = [];

    /**
     * 用于连线的数据
     */
    shapeNumberData: number[] = [];

    /**
     * 形状-填充的矩形
     */
    shapeRectFill = [
        0, 1, 2,
        0, 2, 3
    ];

    /**
     * 形状-填充的 3 角形
     */
    shapeTriangleFill = [
        0, 1, 2
    ];

    /**
     * 绘制背景格子
     */
    DrawBgGrid () {
        let left = root.store.getState().cameraX - window.innerWidth / 2;
        let right = root.store.getState().cameraX + window.innerWidth / 2;
        let bottom = root.store.getState().cameraY - window.innerHeight / 2;
        let top = root.store.getState().cameraY + window.innerHeight / 2;
        // 水平方向
        let horPosArray: number[] = [];
        let horPos = Math.floor( right / config.rectSize ) * config.rectSize;
        while (left < horPos) {
            horPosArray.unshift(horPos);
            horPos -= config.rectSize;
        };
        let horLeft = horPosArray[0] - config.rectSize;
        let horRight = horPosArray[horPosArray.length - 1] + config.rectSize;
        // 垂直方向
        let verPosArray: number[] = [];
        let verPos = Math.floor( top / config.rectSize ) * config.rectSize;
        while (bottom < verPos) {
            verPosArray.unshift(verPos);
            verPos -= config.rectSize;
        };
        let verBottom = verPosArray[0] - config.rectSize;
        let verTop = verPosArray[verPosArray.length - 1] + config.rectSize;

        this.vertexNumberData.length = 0;
        for (let horIndex = 0; horIndex < horPosArray.length; horIndex++) {
            let x = horPosArray[horIndex];
            this.vertexNumberData.push(
                x, verBottom, 0, config.gridColor[0], config.gridColor[1], config.gridColor[2], config.gridColor[3],
                x, verTop, 0, config.gridColor[0], config.gridColor[1], config.gridColor[2], config.gridColor[3]
            );
            if (x == 0) {
                this.vertexNumberData.push(
                    x, 0, 0, config.xColor[0], config.xColor[1], config.xColor[2], config.xColor[3],
                    x, verTop, 0, config.xColor[0], config.xColor[1], config.xColor[2], config.xColor[3]
                );
            };
        };

        // 所有横线
        for (let verIndex = 0; verIndex < verPosArray.length; verIndex++) {
            let y = verPosArray[verIndex];
            this.vertexNumberData.push(
                horLeft, y, 0, config.gridColor[0], config.gridColor[1], config.gridColor[2], config.gridColor[3],
                horRight, y, 0, config.gridColor[0], config.gridColor[1], config.gridColor[2], config.gridColor[3]
            );
            if (y == 0) {
                this.vertexNumberData.push(
                    0, y, 0, config.yColor[0], config.yColor[1], config.yColor[2], config.yColor[3],
                    horRight, y, 0, config.yColor[0], config.yColor[1], config.yColor[2], config.yColor[3]
                );
            };
        };

        this.shapeNumberData.length = 0;
        // 求得顶点数量
        let dotCount = this.vertexNumberData.length / 6;
        for (let dotI = 0; dotI < dotCount; dotI++) {
            this.shapeNumberData.push(dotI);
        };
        
        this.DrawByElementData(
            this.vertexNumberData,
            this.shapeNumberData,
            WebGLRenderingContext.LINES
        );
    }

    /**
     * 绘制当前交互的格子
     */
    DrawTouch () {
        let colorObj = root.store.getState().isPressed ? config.focusFramePressColor : config.focusFrameReleaseColor;
        this.DrawFrame(
            root.store.getState().focusGridX,
            root.store.getState().focusGridY,
            config.focusFrameBorderSize,
            0,
            colorObj
        );
    }

    /**
     * 需要用到的绘制函数
     */
    _drawFuncList: Array<(gridX: number, gridY: number, size: number, z: number, color: number[]) => void> = [];

    /**
     * 用于记录占用了的格子
     */
    locRec: Map<number, Map<number, boolean>> = new Map();

    /**
     * 记录的字典
     */
    public static ptLocRecMap = new ObjectPoolType(
        () => {
            return new Map<number, boolean>();
        },
        (inst) => {

        },
        (inst) => {
            inst.clear();
        }
    )

    /**
     * 绘制方块
     */
    DrawBlock () {
        // 绘制背景颜色
        for (let xI = 0; xI < root.store.getState().blockXRec.length; xI++) {
            let xRec = root.store.getState().blockXRec[xI];
            this.locRec.set(xRec.gridX, ObjectPool.inst.Pop(Webgl.ptLocRecMap));
            for (let yI = 0; yI < xRec.yCollect.length; yI++) {
                let yRec = xRec.yCollect[yI];
                this.locRec.get(xRec.gridX).set(yRec.gridY, true);
                this.DrawRectFill(
                    xRec.gridX,
                    yRec.gridY,
                    0,
                    config.blockBgColor,
                    0
                );
            };
        };
        // 检查某个格子是否存在
        let getExist = (gridX: number, gridY: number) => {
            if (!this.locRec.has(gridX)) {
                return false;
            };
            if (!this.locRec.get(gridX).has(gridY)) {
                return false;
            };
            return true;
        };
        // 绘制边缘颜色
        for (let xI = 0; xI < root.store.getState().blockXRec.length; xI++) {
            let xRec = root.store.getState().blockXRec[xI];
            for (let yI = 0; yI < xRec.yCollect.length; yI++) {
                let yRec = xRec.yCollect[yI];
                this._drawFuncList.length = 0;
                // 左侧无格子
                if (!getExist(xRec.gridX - 1, yRec.gridY)) {
                    this._drawFuncList.push(this.DrawFrameLeft.bind(this));
                };
                // 右侧无格子
                if (!getExist(xRec.gridX + 1, yRec.gridY)) {
                    this._drawFuncList.push(this.DrawFrameRight.bind(this));
                };
                // 下方无格子
                if (!getExist(xRec.gridX, yRec.gridY - 1)) {
                    this._drawFuncList.push(this.DrawFrameBottom.bind(this));
                };
                // 上侧无格子
                if (!getExist(xRec.gridX, yRec.gridY + 1)) {
                    this._drawFuncList.push(this.DrawFrameTop.bind(this));
                };
                // 右上侧无格子
                if (!getExist(xRec.gridX + 1, yRec.gridY + 1)) {
                    this._drawFuncList.push(this.DrawRectRightTop.bind(this));
                };
                // 左上侧无格子
                if (!getExist(xRec.gridX - 1, yRec.gridY + 1)) {
                    this._drawFuncList.push(this.DrawRectLeftTop.bind(this));
                };
                // 左下侧无格子
                if (!getExist(xRec.gridX - 1, yRec.gridY - 1)) {
                    this._drawFuncList.push(this.DrawRectBottomLeft.bind(this));
                };
                // 右下侧无格子
                if (!getExist(xRec.gridX + 1, yRec.gridY - 1)) {
                    this._drawFuncList.push(this.DrawRectBottomRight.bind(this));
                };
                // 进行具体绘制
                this._drawFuncList.forEach(( func ) => {
                    func(
                        xRec.gridX,
                        yRec.gridY,
                        config.blockPadding,
                        0,
                        config.blockPaddingColor
                    );
                });
            };
        };
        this.locRec.forEach(( val ) => {
            ObjectPool.inst.Push(Webgl.ptLocRecMap, val);
        });
        this.locRec.clear();
    }
    
    /**
     * 绘制光源
     */
    DrawLightPoint () {
        // 绘制背景颜色
        for (let xI = 0; xI < root.store.getState().lightXRec.length; xI++) {
            let xRec = root.store.getState().lightXRec[xI];
            for (let yI = 0; yI < xRec.yCollect.length; yI++) {
                let yRec = xRec.yCollect[yI];

                this.DrawRectFill(
                    xRec.gridX,
                    yRec.gridY,
                    0,
                    config.lightPaddingColor,
                    (config.rectSize - config.lightSize) / 2
                );

                this.DrawRectFill(
                    xRec.gridX,
                    yRec.gridY,
                    0,
                    config.lightBgColor,
                    (config.rectSize - config.lightSize) / 2 + config.lightPadding
                );
            };
        };
    }

    /**
     * 绘制光照范围
     */
    DrawLightArea () {
        // 穷举所有光源
        for (let lightXI = 0; lightXI < root.store.getState().lightXRec.length; lightXI++) {
            let lightXRec = root.store.getState().lightXRec[lightXI];
            for (let lightYI = 0; lightYI < lightXRec.yCollect.length; lightYI++) {
                let lightYRec = lightXRec.yCollect[lightYI];

                // 初始化探照光束
                let lightRange = ObjectPool.inst.Pop(LightRange.poolType);
                lightRange.centerOfCircle.elements[0] = (lightXRec.gridX + 0.5) * config.rectSize;
                lightRange.centerOfCircle.elements[1] = (lightYRec.gridY + 0.5) * config.rectSize;
                lightRange.ray1.angle = 0;
                lightRange.ray1.p1.power = 1;
                lightRange.ray1.p1.distance = 0;
                lightRange.ray1.p2.power = 0;
                lightRange.ray1.p2.distance = config.lightDistance;
                lightRange.ray2.angle = 30;
                lightRange.ray2.p1.power = 1;
                lightRange.ray2.p1.distance = 0;
                lightRange.ray2.p2.power = 1;
                lightRange.ray2.p2.distance = config.lightDistance;

                // 光源的中心位置
                let lightP0 = new CuonVector3();
                lightP0.elements[0] = (lightXRec.gridX + 0.5) * config.rectSize;
                lightP0.elements[1] = (lightYRec.gridY + 0.5) * config.rectSize;

                // 点 1
                let lightP1 = new CuonVector3();
                lightP1.elements[0] = lightP0.elements[0] + Math.cos( lightRange.ray1.angle / 180 * Math.PI ) * lightRange.ray1.p2.distance;
                lightP1.elements[1] = lightP0.elements[1] + Math.sin( lightRange.ray1.angle / 180 * Math.PI ) * lightRange.ray1.p2.distance;

                // 点 2
                let lightP2 = new CuonVector3();
                lightP2.elements[0] = lightP0.elements[0] + Math.cos( lightRange.ray2.angle / 180 * Math.PI ) * lightRange.ray2.p2.distance;
                lightP2.elements[1] = lightP0.elements[1] + Math.sin( lightRange.ray2.angle / 180 * Math.PI ) * lightRange.ray2.p2.distance;

                // 探照区域的形状
                let lightPList = [
                    lightP0,
                    lightP1,
                    lightP2
                ];

                // 初始化起始格子
                let blockPos = ObjectPool.inst.Pop(BlockPos.poolType);
                blockPos.gridX = lightXRec.gridX;
                blockPos.gridY = lightYRec.gridY;

                // 经过的格子位置集合
                let crossedblockMap: Map<number, Map<number, BlockPos>> = new Map();
                // 用于穷举的集合
                let blockWalkerList: BlockPos[] = [blockPos];
                // 已经穷举过的位置集合
                let walkedMap: Map<number, Map<number, boolean>> = new Map();
                walkedMap.set(blockPos.gridX, new Map());
                walkedMap.get(blockPos.gridX).set(blockPos.gridY, true);

                // 得到格子联通图
                while (0 < blockWalkerList.length) {
                    let pop = blockWalkerList.shift();

                    // 得到各个边界
                    let left = pop.gridX * config.rectSize;
                    let right = (pop.gridX + 1) * config.rectSize;
                    let bottom = pop.gridY * config.rectSize;
                    let top = (pop.gridY + 1) * config.rectSize;

                    // 左下
                    let gridP1 = new CuonVector3();
                    gridP1.elements[0] = left;
                    gridP1.elements[1] = bottom;

                    // 右下
                    let gridP2 = new CuonVector3();
                    gridP2.elements[0] = right;
                    gridP2.elements[1] = bottom;

                    // 右上
                    let gridP3 = new CuonVector3();
                    gridP3.elements[0] = right;
                    gridP3.elements[1] = top;

                    // 左上
                    let gridP4 = new CuonVector3();
                    gridP4.elements[0] = left;
                    gridP4.elements[1] = top;

                    // 如果是非探照区域的格子，忽略掉，甚至不会有拓展的机会
                    if (!CuonVector3.CheckHasIntersection(
                        lightPList,
                        [
                            gridP1,
                            gridP2,
                            gridP3,
                            gridP4
                        ]
                    )) 
                    {
                        continue;
                    };

                    // 这个位置确实有格子
                    if (!root.CheckGridBlockEmpty(pop.gridX, pop.gridY)) 
                    {
                        // 确保记录起来
                        if (!crossedblockMap.has(pop.gridX)) {
                            crossedblockMap.set(pop.gridX, new Map());
                        };
                        crossedblockMap.get(pop.gridX).set(pop.gridY, pop);
                    };
                    
                    // 穷举所有相邻位置
                    for (let nearI = 0; nearI < Webgl.nearByOffset.length; nearI++) {
                        // 读取相邻数据
                        let nearData = Webgl.nearByOffset[nearI];
                        // 生成相邻位置
                        let nearX = pop.gridX + nearData[0];
                        let nearY = pop.gridY + nearData[1];
                        // 如果已经穷举过该位置，忽略
                        if (walkedMap.has(nearX) && walkedMap.get(nearX).has(nearY)) {
                            continue;
                        };
                        // 标记为该位置已经穷举过
                        if (!walkedMap.has(nearX)) {
                            walkedMap.set(nearX, new Map());
                        };
                        walkedMap.get(nearX).set(nearY, true);

                        // 生成记录
                        let nearInst = ObjectPool.inst.Pop(BlockPos.poolType);
                        nearInst.gridX = nearX;
                        nearInst.gridY = nearY;
                        // 等候穷举
                        blockWalkerList.push(nearInst);
                    };
                };

                // 相关的格子全部绘制出来
                crossedblockMap.forEach(( blockList ) => {
                    blockList.forEach(( block ) => {
                        this.DrawMark(
                            block.gridX,
                            block.gridY,
                            config.rectSize / 4,
                            0,
                            [1, 0, 0, 1]
                        );
                    });
                });

                // 绘制探照区域提示框
                this.DrawByElementData(
                    [
                        lightP0.elements[0], lightP0.elements[1], lightP0.elements[2], ...config.lightRayColor,
                        lightP1.elements[0], lightP1.elements[1], lightP1.elements[2], ...config.lightRayColor,
                        lightP2.elements[0], lightP2.elements[1], lightP2.elements[2], ...config.lightRayColor
                    ],
                    [
                        0, 1,
                        1, 2,
                        2, 0
                    ],
                    WebGLRenderingContext.LINES
                );

                // 待处理的格子列表
                let blockList: BlockPos[] = [];
                crossedblockMap.forEach(( blockColl ) => {
                    blockColl.forEach(( block ) => {
                        blockList.push(block);
                    });
                });

                // 排序，距离近的优先
                blockList.sort((blockA, blockB) => {
                    let ax = (blockA.gridX + 0.5) * config.rectSize;
                    let ay = (blockA.gridY + 0.5) * config.rectSize;
                    let bx = (blockB.gridX + 0.5) * config.rectSize;
                    let by = (blockB.gridY + 0.5) * config.rectSize;

                    return ((lightP0.elements[0] - ax) ** 2 + (lightP0.elements[1] - ay) ** 2)
                         - ((lightP0.elements[0] - bx) ** 2 + (lightP0.elements[1] - by) ** 2)
                });

                // 目前所有的光束
                let lightRangeList: LightRange[] = [lightRange];
                // 新的探照区域集合
                let tempLightRangeList: LightRange[] = [];
                // 渗透探照区域集合
                let peneLightRangeList: LightRange[] = [];
                // 所有格子，对光束进行影响
                for (let blockI = 0; blockI < blockList.length; blockI++) {
                    let blockInst = blockList[blockI];
                    // 方块边界
                    let left = blockInst.gridX * config.rectSize;
                    let right = (blockInst.gridX + 1) * config.rectSize;
                    let bottom = blockInst.gridY * config.rectSize;
                    let top = (blockInst.gridY + 1) * config.rectSize;
                    // 4 个边界点
                    let pLB = new CuonVector3();
                    pLB.elements[0] = left;
                    pLB.elements[1] = bottom;
                    let pRB = new CuonVector3();
                    pRB.elements[0] = right;
                    pRB.elements[1] = bottom;
                    let pRT = new CuonVector3();
                    pRT.elements[0] = right;
                    pRT.elements[1] = top;
                    let pLT = new CuonVector3();
                    pLT.elements[0] = left;
                    pLT.elements[1] = top;
                    // 方块形状
                    let blockShape = [
                        pLB,
                        pRB,
                        pRT,
                        pLT
                    ];
                    // 用于存储受方块切割后的探照区域
                    tempLightRangeList.length = 0;
                    for (let lightI = 0; lightI < lightRangeList.length; lightI++) {
                        let lightInst = lightRangeList[ lightI ];
                        let fromP1 = new CuonVector3();
                        fromP1.elements[0] = lightInst.centerOfCircle.elements[0] + Math.cos(lightInst.ray1.angle / 180 * Math.PI) * lightInst.ray1.p1.distance;
                        fromP1.elements[1] = lightInst.centerOfCircle.elements[1] + Math.sin(lightInst.ray1.angle / 180 * Math.PI) * lightInst.ray1.p1.distance;
                        let fromP2 = new CuonVector3();
                        fromP2.elements[0] = lightInst.centerOfCircle.elements[0] + Math.cos(lightInst.ray1.angle / 180 * Math.PI) * lightInst.ray1.p2.distance;
                        fromP2.elements[1] = lightInst.centerOfCircle.elements[1] + Math.sin(lightInst.ray1.angle / 180 * Math.PI) * lightInst.ray1.p2.distance;
                        let toP1 = new CuonVector3();
                        toP1.elements[0] = lightInst.centerOfCircle.elements[0] + Math.cos(lightInst.ray2.angle / 180 * Math.PI) * lightInst.ray2.p1.distance;
                        toP1.elements[1] = lightInst.centerOfCircle.elements[1] + Math.sin(lightInst.ray2.angle / 180 * Math.PI) * lightInst.ray2.p1.distance;
                        let toP2 = new CuonVector3();
                        toP2.elements[0] = lightInst.centerOfCircle.elements[0] + Math.cos(lightInst.ray2.angle / 180 * Math.PI) * lightInst.ray2.p2.distance;
                        toP2.elements[1] = lightInst.centerOfCircle.elements[1] + Math.sin(lightInst.ray2.angle / 180 * Math.PI) * lightInst.ray2.p2.distance;
                        // 探照区域形状
                        let lightShape = [
                            fromP1,
                            fromP2,
                            toP2,
                            toP1
                        ];
                        // 检测是否有交集
                        let hasIntersection = CuonVector3.CheckHasIntersection(
                            blockShape,
                            lightShape
                        );
                        // 不相干
                        if (!hasIntersection) {
                            tempLightRangeList.push(lightInst);
                            continue;
                        };
                        // 方块 4 个点所处角度
                        let angleList: number[] = blockShape.map((point) => {
                            return Math.atan2(point.elements[1] - lightInst.centerOfCircle.elements[1], point.elements[0] - lightInst.centerOfCircle.elements[0]) / Math.PI * 180;
                        });
                        // 只取范围以内的
                        angleList = angleList.filter((angle) => {
                            return lightInst.ray1.angle < angle && angle < lightInst.ray2.angle;
                        });
                        // 去重
                        let angleSet: Set<number> = new Set();
                        angleList = angleList.filter((angle) => {
                            if (angleSet.has(angle)) {
                                return false;
                            };
                            angleSet.add(angle);
                            return true;
                        });
                        // 角度从小到大排序
                        angleList.sort((angleA, angleB) => {
                            return angleA - angleB;
                        });
                        // 得到完整的角度划分
                        angleList.unshift(lightInst.ray1.angle);
                        angleList.push(lightInst.ray2.angle);
                        // 每个角度都和前一个角度
                        for (let i = 0; i < angleList.length - 1; i++) {
                            // 当前角度
                            let fromAngle = angleList[i];
                            // 下一个角度
                            let toAngle = angleList[i + 1];

                            // 起始射线起始点
                            let fFromDistance = this.GetDistanceAngleToLine(
                                lightInst.ray1.angle,
                                lightInst.ray1.p1.distance,
                                lightInst.ray2.angle,
                                lightInst.ray2.p1.distance,
                                fromAngle
                            );
                            // 起始射线起始强度
                            let fFromPower = this.GetDistancePointToPoint(
                                fromAngle,
                                fFromDistance,
                                lightInst.ray1.angle,
                                lightInst.ray1.p1.distance
                            )
                            /
                            this.GetDistancePointToPoint(
                                lightInst.ray2.angle,
                                lightInst.ray2.p1.distance,
                                lightInst.ray1.angle,
                                lightInst.ray1.p1.distance
                            )
                            * (lightInst.ray2.p1.power - lightInst.ray1.p1.power) 
                            + lightInst.ray1.p1.power;

                            // 起始射线终点
                            let fToDistance = this.GetDistanceAngleToLine(
                                lightInst.ray1.angle,
                                lightInst.ray1.p2.distance,
                                lightInst.ray2.angle,
                                lightInst.ray2.p2.distance,
                                fromAngle
                            );
                            // 起始射线终点强度
                            let fToPower = this.GetDistancePointToPoint(
                                toAngle,
                                fToDistance,
                                lightInst.ray1.angle,
                                lightInst.ray1.p2.distance
                            )
                            /
                            this.GetDistancePointToPoint(
                                lightInst.ray2.angle,
                                lightInst.ray2.p2.distance,
                                lightInst.ray1.angle,
                                lightInst.ray1.p2.distance
                            )
                            * (lightInst.ray2.p2.power - lightInst.ray1.p2.power) 
                            + lightInst.ray1.p2.power;

                            // 起始射线起始点
                            let tFromDistance = this.GetDistanceAngleToLine(
                                lightInst.ray1.angle,
                                lightInst.ray1.p1.distance,
                                lightInst.ray2.angle,
                                lightInst.ray2.p1.distance,
                                toAngle
                            );
                            // 起始射线起始强度
                            let tFromPower = this.GetDistancePointToPoint(
                                toAngle,
                                tFromDistance,
                                lightInst.ray1.angle,
                                lightInst.ray1.p1.distance
                            )
                            /
                            this.GetDistancePointToPoint(
                                lightInst.ray2.angle,
                                lightInst.ray2.p1.distance,
                                lightInst.ray1.angle,
                                lightInst.ray1.p1.distance
                            )
                            * (lightInst.ray2.p1.power - lightInst.ray1.p1.power) 
                            + lightInst.ray1.p1.power;

                            // 起始射线终点
                            let tToDistance = this.GetDistanceAngleToLine(
                                lightInst.ray1.angle,
                                lightInst.ray1.p2.distance,
                                lightInst.ray2.angle,
                                lightInst.ray2.p2.distance,
                                toAngle
                            );
                            // 起始射线终点强度
                            let tToPower = this.GetDistancePointToPoint(
                                toAngle,
                                tToDistance,
                                lightInst.ray1.angle,
                                lightInst.ray1.p2.distance
                            )
                            /
                            this.GetDistancePointToPoint(
                                lightInst.ray2.angle,
                                lightInst.ray2.p2.distance,
                                lightInst.ray1.angle,
                                lightInst.ray1.p2.distance
                            )
                            * (lightInst.ray2.p2.power - lightInst.ray1.p2.power) 
                            + lightInst.ray1.p2.power;
                            // 生成一个新的探照区域
                            let genLightArea = ObjectPool.inst.Pop(LightRange.poolType);
                            genLightArea.centerOfCircle.elements[0] = lightInst.centerOfCircle.elements[0];
                            genLightArea.centerOfCircle.elements[1] = lightInst.centerOfCircle.elements[1];
                            genLightArea.ray1.angle = fromAngle;
                            genLightArea.ray1.p1.distance = fFromDistance;
                            genLightArea.ray1.p1.power = fFromPower;
                            genLightArea.ray1.p2.distance = fToDistance;
                            genLightArea.ray1.p2.power = fToPower;
                            genLightArea.ray2.angle = toAngle;
                            genLightArea.ray2.p1.distance = tFromDistance;
                            genLightArea.ray2.p1.power = tFromPower;
                            genLightArea.ray2.p2.distance = tToDistance;
                            genLightArea.ray2.p2.power = tToPower;
                            // 放入探照区域集合里面
                            tempLightRangeList.push(genLightArea);
                        };
                    };
                    // 清除渗透集合
                    peneLightRangeList.length = 0;
                    // 穷举所有划分了的光线，进行渗透处理
                    for (let tempI = 0; tempI < tempLightRangeList.length; tempI++) {
                        let tempLightInst = tempLightRangeList[tempI];
                        // 探照区域的 4 个关键点
                        let fromP1 = [
                            tempLightInst.centerOfCircle.elements[0] + Math.cos(tempLightInst.ray1.angle / 180 * Math.PI) * tempLightInst.ray1.p1.distance,
                            tempLightInst.centerOfCircle.elements[1] + Math.sin(tempLightInst.ray1.angle / 180 * Math.PI) * tempLightInst.ray1.p1.distance
                        ];
                        let fromP2 = [
                            tempLightInst.centerOfCircle.elements[0] + Math.cos(tempLightInst.ray1.angle / 180 * Math.PI) * tempLightInst.ray1.p2.distance,
                            tempLightInst.centerOfCircle.elements[1] + Math.sin(tempLightInst.ray1.angle / 180 * Math.PI) * tempLightInst.ray1.p2.distance
                        ];
                        // 衰减速度
                        let fromLowerSpeed: number = 0;
                        if (tempLightInst.ray1.p1.distance != tempLightInst.ray1.p2.distance) {
                            fromLowerSpeed = (tempLightInst.ray1.p2.power - tempLightInst.ray1.p1.power) / (tempLightInst.ray1.p2.distance - tempLightInst.ray1.p1.distance);
                        };

                        let toP1 = [
                            tempLightInst.centerOfCircle.elements[0] + Math.cos(tempLightInst.ray2.angle / 180 * Math.PI) * tempLightInst.ray2.p1.distance,
                            tempLightInst.centerOfCircle.elements[1] + Math.sin(tempLightInst.ray2.angle / 180 * Math.PI) * tempLightInst.ray2.p1.distance
                        ];
                        let toP2 = [
                            tempLightInst.centerOfCircle.elements[0] + Math.cos(tempLightInst.ray2.angle / 180 * Math.PI) * tempLightInst.ray2.p2.distance,
                            tempLightInst.centerOfCircle.elements[1] + Math.sin(tempLightInst.ray2.angle / 180 * Math.PI) * tempLightInst.ray2.p2.distance
                        ];
                        // 衰减速度
                        let toLowerSpeed: number = 0;
                        if (tempLightInst.ray2.p1.distance != tempLightInst.ray2.p2.distance) {
                            toLowerSpeed = (tempLightInst.ray2.p2.power - tempLightInst.ray2.p1.power) / (tempLightInst.ray2.p2.distance - tempLightInst.ray2.p1.distance);
                        };

                        // 方块 4 个点所处角度
                        let angleList: number[] = blockShape.map((point) => {
                            return Math.atan2(point.elements[1] - tempLightInst.centerOfCircle.elements[1], point.elements[0] - tempLightInst.centerOfCircle.elements[0]) / Math.PI * 180;
                        });
                        // 去重
                        let angleSet: Set<number> = new Set();
                        angleList = angleList.filter((angle) => {
                            if (angleSet.has(angle)) {
                                return false;
                            };
                            angleSet.add(angle);
                            return true;
                        });
                        // 排序
                        angleList.sort((angleA, angleB) => {
                            return angleA - angleB;
                        });
                        // 与方块无交集，直接采纳
                        if (angleList[angleList.length - 1] <= tempLightInst.ray1.angle) {
                            peneLightRangeList.push(tempLightInst);
                            continue;
                        };
                        // 与方块无交集，直接采纳
                        if (tempLightInst.ray2.angle <= angleList[0]) {
                            peneLightRangeList.push(tempLightInst);
                            continue;
                        };
                        // 起始射线的函数
                        let kFrom = Math.tan(tempLightInst.ray1.angle / 180 * Math.PI);
                        let bFrom = tempLightInst.centerOfCircle.elements[1] - kFrom * tempLightInst.centerOfCircle.elements[0];
                        // 4 个交点
                        let rayFPoints = [
                            [
                                left,
                                kFrom * left + bFrom
                            ],
                            [
                                right,
                                kFrom * right + bFrom
                            ],
                            [
                                (bottom - bFrom) / kFrom,
                                bottom
                            ],
                            [
                                (top - bFrom) / kFrom,
                                top
                            ]
                        ];
                        // 排序-就近优先
                        rayFPoints.sort(( p1, p2 ) => {
                            return ((p1[0] - tempLightInst.centerOfCircle.elements[0]) ** 2 + (p1[1] - tempLightInst.centerOfCircle.elements[1]) ** 2)
                                - ((p2[0] - tempLightInst.centerOfCircle.elements[0]) ** 2 + (p2[1] - tempLightInst.centerOfCircle.elements[1]) ** 2)
                        });
                        // 记录强度
                        rayFPoints.forEach(( point ) => {
                            point[3] = Math.sqrt((point[0] - tempLightInst.centerOfCircle.elements[0]) ** 2 + (point[1] - tempLightInst.centerOfCircle.elements[1]) ** 2);
                            point[2] = Math.sqrt(
                                (
                                    point[0] - fromP1[0]) ** 2 
                                    + (point[1] - fromP1[1]) ** 2
                                ) 
                                / 
                                (
                                    tempLightInst.ray1.p2.distance 
                                    - tempLightInst.ray1.p1.distance
                                ) 
                                * 
                                (
                                    
                                    tempLightInst.ray1.p2.power
                                    - tempLightInst.ray1.p1.power 
                                ) 
                                + tempLightInst.ray1.p2.power;
                        });
                        // 得到穿透厚度
                        let fromCrossDistance = Math.sqrt((rayFPoints[1][0] - rayFPoints[2][0]) ** 2 + (rayFPoints[1][1] - rayFPoints[2][1]) ** 2);

                        // 终点射线的函数
                        let kTo = Math.tan(tempLightInst.ray2.angle / 180 * Math.PI);
                        let bTo = tempLightInst.centerOfCircle.elements[1] - kTo * tempLightInst.centerOfCircle.elements[0];
                        // 4 个交点
                        let rayTPoints = [
                            [
                                left,
                                kTo * left + bTo
                            ],
                            [
                                right,
                                kTo * right + bTo
                            ],
                            [
                                (bottom - bTo) / kTo,
                                bottom
                            ],
                            [
                                (top - bTo) / kTo,
                                top
                            ]
                        ];
                        // 排序-就近优先
                        rayTPoints.sort(( p1, p2 ) => {
                            return ((p1[0] - tempLightInst.centerOfCircle.elements[0]) ** 2 + (p1[1] - tempLightInst.centerOfCircle.elements[1]) ** 2)
                                - ((p2[0] - tempLightInst.centerOfCircle.elements[0]) ** 2 + (p2[1] - tempLightInst.centerOfCircle.elements[1]) ** 2)
                        });
                        // 记录强度
                        rayTPoints.forEach(( point ) => {
                            point[3] = Math.sqrt((point[0] - tempLightInst.centerOfCircle.elements[0]) ** 2 + (point[1] - tempLightInst.centerOfCircle.elements[1]) ** 2);
                            point[2] = Math.sqrt(
                                (
                                    point[0] - toP1[0]) ** 2 
                                    + (point[1] - toP1[1]) ** 2
                                ) 
                                / 
                                (
                                    tempLightInst.ray2.p2.distance 
                                    - tempLightInst.ray2.p1.distance
                                ) 
                                * 
                                (
                                    
                                    tempLightInst.ray2.p2.power
                                    - tempLightInst.ray2.p1.power 
                                ) 
                                + tempLightInst.ray2.p2.power;
                        });
                        // 得到穿透厚度
                        let toCrossDistance = Math.sqrt((rayTPoints[1][0] - rayTPoints[2][0]) ** 2 + (rayTPoints[1][1] - rayTPoints[2][1]) ** 2);

                        // 部分 1
                        let part1 = ObjectPool.inst.Pop(LightRange.poolType);
                        // 圆心
                        part1.centerOfCircle.elements[0] = tempLightInst.centerOfCircle.elements[0];
                        part1.centerOfCircle.elements[1] = tempLightInst.centerOfCircle.elements[1];
                        // 起始射线
                        part1.ray1.angle = tempLightInst.ray1.angle;
                        part1.ray1.p1.distance = tempLightInst.ray1.p1.distance;
                        part1.ray1.p1.power = tempLightInst.ray1.p1.power;
                        part1.ray1.p2.distance = rayFPoints[1][3];
                        part1.ray1.p2.power = rayFPoints[1][2];
                        // 结束射线
                        part1.ray2.angle = tempLightInst.ray2.angle;
                        part1.ray2.p1.distance = tempLightInst.ray2.p1.distance;
                        part1.ray2.p1.power = tempLightInst.ray2.p1.power;
                        part1.ray2.p2.distance = rayTPoints[1][3];
                        part1.ray2.p2.power = rayTPoints[1][2];
                        peneLightRangeList.push(part1);

                        // 如果都突破不了
                        if (rayFPoints[2][2] <= 0 && rayTPoints[2][2] <= 0) {
                            let fRayDistance = rayFPoints[1][2] / (1 + fromLowerSpeed);
                            let tRayDistance = rayTPoints[1][2] / (1 + toLowerSpeed);

                            // 部分 2
                            let part2 = ObjectPool.inst.Pop(LightRange.poolType);
                            // 圆心
                            part2.centerOfCircle.elements[0] = tempLightInst.centerOfCircle.elements[0];
                            part2.centerOfCircle.elements[1] = tempLightInst.centerOfCircle.elements[1];
                            // 起始射线
                            part2.ray1.angle = tempLightInst.ray1.angle;
                            part2.ray1.p1.distance = rayFPoints[1][3];
                            part2.ray1.p1.power = rayFPoints[1][2];
                            part2.ray1.p2.distance = fRayDistance;
                            part2.ray1.p2.power = 0;
                            // 结束射线
                            part2.ray2.angle = tempLightInst.ray2.angle;
                            part2.ray2.p1.distance = rayTPoints[1][3];
                            part2.ray2.p1.power = rayTPoints[1][2];
                            part2.ray2.p2.distance = tRayDistance;
                            part2.ray2.p2.power = 0;
                            peneLightRangeList.push(part2);
                            continue;
                        };
                        // 如果都突破成功
                        if (0 <= rayFPoints[2][2] && 0 <= rayTPoints[2][2]) {
                            // 部分 2
                            let part2 = ObjectPool.inst.Pop(LightRange.poolType);
                            // 圆心
                            part2.centerOfCircle.elements[0] = tempLightInst.centerOfCircle.elements[0];
                            part2.centerOfCircle.elements[1] = tempLightInst.centerOfCircle.elements[1];
                            // 起始射线
                            part2.ray1.angle = tempLightInst.ray1.angle;
                            part2.ray1.p1.distance = rayFPoints[1][3];
                            part2.ray1.p1.power = rayFPoints[1][2];
                            part2.ray1.p2.distance = rayFPoints[2][3];
                            part2.ray1.p2.power = rayFPoints[2][2];
                            // 结束射线
                            part2.ray2.angle = tempLightInst.ray2.angle;
                            part2.ray2.p1.distance = rayTPoints[1][3];
                            part2.ray2.p1.power = rayTPoints[1][2];
                            part2.ray2.p2.distance = rayTPoints[2][3];
                            part2.ray2.p2.power = rayTPoints[2][2];
                            peneLightRangeList.push(part2);

                            // 部分 3
                            let part3 = ObjectPool.inst.Pop(LightRange.poolType);
                            // 圆心
                            part3.centerOfCircle.elements[0] = tempLightInst.centerOfCircle.elements[0];
                            part3.centerOfCircle.elements[1] = tempLightInst.centerOfCircle.elements[1];
                            // 起始射线
                            part3.ray1.angle = tempLightInst.ray1.angle;
                            part3.ray1.p1.distance = rayFPoints[2][3];
                            part3.ray1.p1.power = rayFPoints[2][2];
                            // 附加衰减至 0 的距离
                            part3.ray1.p2.distance = rayFPoints[2][3] + (fromLowerSpeed == 0 ? 0 : rayFPoints[2][2] / fromLowerSpeed);
                            part3.ray1.p2.power = 0;
                            // 结束射线
                            part3.ray2.angle = tempLightInst.ray2.angle;
                            part3.ray2.p1.distance = rayTPoints[2][3];
                            part3.ray2.p1.power = rayTPoints[2][2];
                            // 附加衰减至 0 的距离
                            part3.ray2.p2.distance = rayTPoints[2][3] + (toLowerSpeed == 0 ? 0 : rayTPoints[2][2] / toLowerSpeed);
                            part3.ray2.p2.power = 0;
                            peneLightRangeList.push(part3);
                            continue;
                        };

                        // 一边突破成功，一边突破不成功，某个比率使得，射线在恰好离开方块时候消亡
                        // rate * (toCrossDistance - fromCrossDistance) + fromCrossDistance = rate * (rayTPoints[2][2] - rayFPoints[2][2]) + rayFPoints[2][2];
                        // 计算恰好渗透到抵消的比率
                        let rate: number = (rayFPoints[1][2] - fromCrossDistance) / ((toCrossDistance - fromCrossDistance) - (rayTPoints[2][2] - rayFPoints[2][2]));
                        // 分割点 1
                        let rateP1 = [(rayTPoints[1][0] - rayFPoints[1][0]) * rate + rayFPoints[1][0], (rayTPoints[1][1] - rayFPoints[1][1]) * rate + rayFPoints[1][1]];
                        // 分割点 2
                        let rateP2 = [(rayTPoints[2][0] - rayFPoints[2][0]) * rate + rayFPoints[2][0], (rayTPoints[2][1] - rayFPoints[2][1]) * rate + rayFPoints[2][1]];
                        // 分割点 角度
                        let rateAngle = Math.atan2(rateP2[1] - tempLightInst.centerOfCircle.elements[1], rateP2[0] - tempLightInst.centerOfCircle.elements[0]) / Math.PI * 180;

                        // 如果是起始射线突出
                        if (0 < rayFPoints[2][2]) {
                            
                            continue;
                        };

                        // 如果是终点射线突出
                        if (0 < rayTPoints[2][2]) {
                            continue;
                        };
                    };
                    lightRangeList.length = 0;
                    // 更换为新的探照区域集合
                    lightRangeList.push(...peneLightRangeList);
                };
                // 穷举所有探照区域
                for (let i = 0; i < lightRangeList.length; i++) {
                    let lightInst = lightRangeList[i];
                    let fPFrom = [
                        lightInst.centerOfCircle.elements[0] + Math.cos(lightInst.ray1.angle / 180 * Math.PI) * lightInst.ray1.p1.distance,
                        lightInst.centerOfCircle.elements[1] + Math.sin(lightInst.ray1.angle / 180 * Math.PI) * lightInst.ray1.p1.distance
                    ];
                    let fPTo = [
                        lightInst.centerOfCircle.elements[0] + Math.cos(lightInst.ray1.angle / 180 * Math.PI) * lightInst.ray1.p2.distance,
                        lightInst.centerOfCircle.elements[1] + Math.sin(lightInst.ray1.angle / 180 * Math.PI) * lightInst.ray1.p2.distance
                    ];
                    let tPFrom = [
                        lightInst.centerOfCircle.elements[0] + Math.cos(lightInst.ray2.angle / 180 * Math.PI) * lightInst.ray2.p1.distance,
                        lightInst.centerOfCircle.elements[1] + Math.sin(lightInst.ray2.angle / 180 * Math.PI) * lightInst.ray2.p1.distance
                    ];
                    let tPTo = [
                        lightInst.centerOfCircle.elements[0] + Math.cos(lightInst.ray2.angle / 180 * Math.PI) * lightInst.ray2.p2.distance,
                        lightInst.centerOfCircle.elements[1] + Math.sin(lightInst.ray2.angle / 180 * Math.PI) * lightInst.ray2.p2.distance
                    ];
                    // 把所有探照区域都绘制出来
                    this.vertexNumberData.length = 0;
                    this.shapeNumberData.length = 0;
                    // 4 边形数据
                    this.vertexNumberData.push(...[
                        ...fPFrom, 0, ...config.lightSplitedColor,
                        ...fPTo, 0, ...config.lightSplitedColor,
                        ...tPTo, 0, ...config.lightSplitedColor,
                        ...tPFrom, 0, ...config.lightSplitedColor
                    ]);
                    this.shapeNumberData.push(...[
                        0, 1,
                        1, 2,
                        2, 3,
                        3, 0
                    ]);
                    this.DrawByElementData(
                        this.vertexNumberData,
                        this.shapeNumberData,
                        WebGLRenderingContext.LINES
                    );
                };
            };
        };
    }

    /**
     * 相邻位置集合
     */
    static nearByOffset: number[][] = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
    ];

    /**
     * 获取点 1、2 的距离
     * @param a1 
     * @param d1 
     * @param a2 
     * @param d2 
     */
    GetDistancePointToPoint (
        a1: number,
        d1: number,
        a2: number,
        d2: number
    )
    {
        let pos1 = [Math.cos(a1 / 180 * Math.PI) * d1, Math.sin(a1 / 180 * Math.PI) * d1];
        let pos2 = [Math.cos(a2 / 180 * Math.PI) * d2, Math.sin(a2 / 180 * Math.PI) * d2];
        return Math.sqrt((pos1[0] - pos2[0]) ** 2 + (pos2[0] - pos2[0]) ** 2);
    }

    /**
     * 取得射线 angle 与点 1、2 连线的交点距离
     * @param a1 
     * @param d1 
     * @param a2 
     * @param d2 
     * @param angle 
     * @returns 
     */
    GetDistanceAngleToLine (
        a1: number,
        d1: number,
        a2: number,
        d2: number,
        angle: number
    )
    {
        a1 = a1 / 180 * Math.PI;
        a2 = a2 / 180 * Math.PI;
        angle = angle / 180 * Math.PI;
        let p1 = [Math.cos(a1) * d1, Math.sin(a1) * d1];
        let p2 = [Math.cos(a2) * d2, Math.sin(a2) * d2];

        let p12 = new CuonVector3();
        p12.elements[0] = p2[0] - p1[0];
        p12.elements[1] = p2[1] - p1[1];

        let right = p12.GetRight();
        let cosAngle = Math.cos(angle);
        let sinAngle = Math.sin(angle);
        let deno = (cosAngle * right.elements[0] + sinAngle * right.elements[1]);
        if (deno == 0) {
            return 0;
        };
        return (p2[0] * right.elements[0] + p2[1] * right.elements[1]) / deno;
    }

    /**
     * 给某方格绘制标记
     * @param gridX 
     * @param gridY 
     * @param size 
     * @param z 
     * @param color 
     */
    DrawMark (
        gridX: number,
        gridY: number,
        size: number,
        z: number,
        color: number[]
    )
    {
        let centerX = (gridX + 0.5) * config.rectSize;
        let centerY = (gridY + 0.5) * config.rectSize;
        this.DrawByElementData(
            [
                centerX - size, centerY, z, ...color,
                centerX + size, centerY, z, ...color,
                centerX, centerY - size, z, ...color,
                centerX, centerY + size, z, ...color,
            ],
            [
                0, 1,
                2, 3
            ],
            WebGLRenderingContext.LINES
        )
    }

    /**
     * 需要用到的绘制函数
     */
     _drawFrameFuncList: Array<(gridX: number, gridY: number, size: number, z: number, color: number[]) => void> = [];

    /**
     * 绘制选框
     * @param gridX 
     * @param gridY 
     * @param size 
     * @param z 
     * @param color 
     */
    DrawFrame (
        gridX: number,
        gridY: number,
        size: number,
        z: number,
        color: number[]
    )
    {
        // 进行具体绘制
        this._drawFrameFuncList.forEach(( func ) => {
            func(
                gridX,
                gridY,
                size,
                z,
                color
            );
        });
    }

    /**
     * 绘制框的左边
     * @param gridX 
     * @param gridY 
     * @param size 
     * @param z 
     * @param color 
     */
    DrawFrameLeft (
        gridX: number,
        gridY: number,
        size: number,
        z: number,
        color: number[]
    ) 
    {
        let left = gridX * config.rectSize;
        let bottom = gridY * config.rectSize;
        let top = (gridY + 1) * config.rectSize;
        this.vertexNumberData.length = 0;
        this.vertexNumberData.push(
            left + size, top, z, color[0], color[1], color[2], color[3],
            left, top, z, color[0], color[1], color[2], color[3],
            left, bottom, z, color[0], color[1], color[2], color[3],
            left + size, bottom, z, color[0], color[1], color[2], color[3]
        );
        this.DrawByElementData(
            this.vertexNumberData,
            this.shapeRectFill,
            WebGLRenderingContext.TRIANGLES
        );
    }

    /**
     * 绘制框的右边
     * @param gridX 
     * @param gridY 
     * @param size 
     * @param z 
     * @param color 
     */
    DrawFrameRight (
        gridX: number,
        gridY: number,
        size: number,
        z: number,
        color: number[]
    )
    {
        let right = (gridX + 1) * config.rectSize;
        let bottom = gridY * config.rectSize;
        let top = (gridY + 1) * config.rectSize;
        this.vertexNumberData.length = 0;
        this.vertexNumberData.push(
            right, top, z, color[0], color[1], color[2], color[3],
            right - size, top, z, color[0], color[1], color[2], color[3],
            right - size, bottom, z, color[0], color[1], color[2], color[3],
            right, bottom, z, color[0], color[1], color[2], color[3]
        );
        this.DrawByElementData(
            this.vertexNumberData,
            this.shapeRectFill,
            WebGLRenderingContext.TRIANGLES
        );
    }

    /**
     * 绘制框的下边
     * @param gridX 
     * @param gridY 
     * @param size 
     * @param z 
     * @param color 
     */
    DrawFrameBottom (
        gridX: number,
        gridY: number,
        size: number,
        z: number,
        color: number[]
    )
    {
        let left = gridX * config.rectSize;
        let right = (gridX + 1) * config.rectSize;
        let bottom = gridY * config.rectSize;
        this.vertexNumberData.length = 0;
        this.vertexNumberData.push(
            right, bottom + size, z, color[0], color[1], color[2], color[3],
            left, bottom + size, z, color[0], color[1], color[2], color[3],
            left, bottom, z, color[0], color[1], color[2], color[3],
            right, bottom, z, color[0], color[1], color[2], color[3]
        );
        this.DrawByElementData(
            this.vertexNumberData,
            this.shapeRectFill,
            WebGLRenderingContext.TRIANGLES
        );
    }

    /**
     * 绘制框的上边
     * @param gridX 
     * @param gridY 
     * @param size 
     * @param z 
     * @param color 
     */
    DrawFrameTop (
        gridX: number,
        gridY: number,
        size: number,
        z: number,
        color: number[]
    )
    {
        let left = gridX * config.rectSize;
        let right = (gridX + 1) * config.rectSize;
        let top = (gridY + 1) * config.rectSize;
        this.vertexNumberData.length = 0;
        this.vertexNumberData.push(
            right, top, z, color[0], color[1], color[2], color[3],
            left, top, z, color[0], color[1], color[2], color[3],
            left, top - size, z, color[0], color[1], color[2], color[3],
            right, top - size, z, color[0], color[1], color[2], color[3]
        );
        this.DrawByElementData(
            this.vertexNumberData,
            this.shapeRectFill,
            WebGLRenderingContext.TRIANGLES
        );
    }

    /**
     * 绘制右上补角
     * @param gridX 
     * @param gridY 
     * @param size 
     * @param z 
     * @param color 
     */
    DrawRectRightTop (
        gridX: number,
        gridY: number,
        size: number,
        z: number,
        color: number[]
    )
    {
        let right = (gridX + 1) * config.rectSize;
        let top = (gridY + 1) * config.rectSize;
        this.vertexNumberData.length = 0;
        this.vertexNumberData.push(
            right, top, z, color[0], color[1], color[2], color[3],
            right - size, top, z, color[0], color[1], color[2], color[3],
            right - size, top - size, z, color[0], color[1], color[2], color[3],
            right, top - size, z, color[0], color[1], color[2], color[3]
        );
        this.DrawByElementData(
            this.vertexNumberData,
            this.shapeRectFill,
            WebGLRenderingContext.TRIANGLES
        );
    }

    /**
     * 绘制左上补角
     * @param gridX 
     * @param gridY 
     * @param size 
     * @param z 
     * @param color 
     */
    DrawRectLeftTop (
        gridX: number,
        gridY: number,
        size: number,
        z: number,
        color: number[]
    )
    {
        let left = gridX * config.rectSize;
        let top = (gridY + 1) * config.rectSize;
        this.vertexNumberData.length = 0;
        this.vertexNumberData.push(
            left + size, top, z, color[0], color[1], color[2], color[3],
            left, top, z, color[0], color[1], color[2], color[3],
            left, top - size, z, color[0], color[1], color[2], color[3],
            left + size, top - size, z, color[0], color[1], color[2], color[3]
        );
        this.DrawByElementData(
            this.vertexNumberData,
            this.shapeRectFill,
            WebGLRenderingContext.TRIANGLES
        );
    }

    /**
     * 绘制左下补角
     * @param gridX 
     * @param gridY 
     * @param size 
     * @param z 
     * @param color 
     */
    DrawRectBottomLeft (
        gridX: number,
        gridY: number,
        size: number,
        z: number,
        color: number[]
    )
    {
        let left = gridX * config.rectSize;
        let bottom = gridY * config.rectSize;
        this.vertexNumberData.length = 0;
        this.vertexNumberData.push(
            left + size, bottom + size, z, color[0], color[1], color[2], color[3],
            left, bottom + size, z, color[0], color[1], color[2], color[3],
            left, bottom, z, color[0], color[1], color[2], color[3],
            left + size, bottom, z, color[0], color[1], color[2], color[3]
        );
        this.DrawByElementData(
            this.vertexNumberData,
            this.shapeRectFill,
            WebGLRenderingContext.TRIANGLES
        );
    }

    /**
     * 绘制右下补角
     * @param gridX 
     * @param gridY 
     * @param size 
     * @param z 
     * @param color 
     */
    DrawRectBottomRight (
        gridX: number,
        gridY: number,
        size: number,
        z: number,
        color: number[]
    )
    {
        let right = (gridX + 1) * config.rectSize;
        let bottom = gridY * config.rectSize;
        this.vertexNumberData.length = 0;
        this.vertexNumberData.push(
            right, bottom + size, z, color[0], color[1], color[2], color[3],
            right - size, bottom + size, z, color[0], color[1], color[2], color[3],
            right - size, bottom, z, color[0], color[1], color[2], color[3],
            right, bottom, z, color[0], color[1], color[2], color[3]
        );
        this.DrawByElementData(
            this.vertexNumberData,
            this.shapeRectFill,
            WebGLRenderingContext.TRIANGLES
        );
    }

    /**
     * 绘制实心矩形
     * @param gridX 
     * @param gridY 
     * @param z 
     * @param r 
     * @param g 
     * @param b 
     */
    DrawRectFill (
        gridX: number,
        gridY: number,
        z: number,
        color: number[],
        padding: number
    ) 
    {
        let left = gridX * config.rectSize;
        let right = (gridX + 1) * config.rectSize;
        let bottom = gridY * config.rectSize;
        let top = (gridY + 1) * config.rectSize;

        left += padding;
        right -= padding;
        bottom += padding;
        top -= padding;

        this.vertexNumberData.length = 0;
        this.vertexNumberData.push(
            right, top, z, color[0], color[1], color[2], color[3],
            left, top, z, color[0], color[1], color[2],  color[3],
            left, bottom, z, color[0], color[1], color[2], color[3],
            right, bottom, z, color[0], color[1], color[2],  color[3]
        );
        this.DrawByElementData(
            this.vertexNumberData,
            this.shapeRectFill,
            WebGLRenderingContext.TRIANGLES
        );
    }

    /**
     * 顶点数据
     */
    elementData = new Float32Array();

    /**
     * 图形数据
     */
    vertexIndexData = new Uint8Array();

    /**
     * 通过顶点数据绘制图形
     * @param elementData 
     * @param vertexIndexData 
     * @param shaderType 
     */
    DrawByElementData (
        elementNumberData: number[],
        vertexIndexNumberData: number[],
        shaderType: number
    )
    {
        if (this.elementData.length < elementNumberData.length) {
            this.elementData = new Float32Array(elementNumberData);
        }
        else {
            this.elementData.set(elementNumberData);
        };

        if (this.vertexIndexData.length < vertexIndexNumberData.length) {
            this.vertexIndexData = new Uint8Array(vertexIndexNumberData);
        }
        else {
            this.vertexIndexData.set(vertexIndexNumberData);
        };

        // 确定使用的着色器程序
        this.gl.useProgram(this.program);

        // 填充顶点数据
        this.gl.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, this.vbuffer);
        this.gl.bufferData(WebGLRenderingContext.ARRAY_BUFFER, this.elementData, WebGLRenderingContext.STATIC_DRAW);

        // 填充坐标数据
        this.gl.vertexAttribPointer(this.attlocPos, 3, this.gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 7, 0);
        this.gl.enableVertexAttribArray(this.attlocPos);

        // 填充颜色数据
        this.gl.vertexAttribPointer(this.attlocColor, 4, this.gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 7, Float32Array.BYTES_PER_ELEMENT * 3);
        this.gl.enableVertexAttribArray(this.attlocColor);
        
        // 传入变换矩阵
        this.gl.uniformMatrix4fv(this.attlocMvpMat, false, this._vpMatrix.elements);

        // 传入顶点索引数据
        this.gl.bindBuffer(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, this.iBuffer);
        this.gl.bufferData(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, this.vertexIndexData, WebGLRenderingContext.STATIC_DRAW);

        // 进行元素绘制
        this.gl.drawElements(
            shaderType,
            vertexIndexNumberData.length,
            WebGLRenderingContext.UNSIGNED_BYTE,
            0
        );
    }

    public override render () {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%"
                }}
            >
                <canvas 
                    ref={(ref) => {
                        this.canvas = ref;
                        if (this.canvas == null) {
                            return;
                        };
                        root.touchMachine.ListenTouch(this.canvas);
                        this.gl = cuonUtils.getWebGLContext(ref);
                        this.program = cuonUtils.createProgram(this.gl, colorVertex.shader, colorFragment.shader);
                        this.vbuffer = this.gl.createBuffer();
                        this.iBuffer = this.gl.createBuffer();
                        this.attlocPos = this.gl.getAttribLocation(this.program, colorVertex.attNamePos);
                        this.attlocColor = this.gl.getAttribLocation(this.program, colorVertex.attNameColor);
                        this.attlocMvpMat = this.gl.getUniformLocation(this.program, colorVertex.attNameMvpMat);
                        this.gl.clearColor(
                            config.bgColor[0],
                            config.bgColor[1],
                            config.bgColor[2],
                            config.bgColor[3]
                        );
                        this.gl.enable(WebGLRenderingContext.BLEND);
                        this.gl.blendFunc(WebGLRenderingContext.SRC_ALPHA, WebGLRenderingContext.ONE_MINUS_SRC_ALPHA);
                    }}
                    width={window.innerWidth}
                    height={window.innerHeight}
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "block"
                    }}
                >
                </canvas>
            </div>
            
        )
    }
}

const Webgl = connect(state => state)(Component);
export default Webgl;