import React from "react";
import CuonMatrix4 from "../../lib/webgl/CuonMatrix4";
import cuonUtils from "../../lib/webgl/CuonUtils";
import config from "../Config";
import colorFragment from "../shader/ColorFragment";
import colorVertex from "../shader/ColorVertex";
import {connect} from 'react-redux';
import root from "../Root";
import CuonVector3 from "../../lib/webgl/CuonVector3";
import LightAreaRec from "../struct/LightAreaRec";
import CuonVector4 from "../../lib/webgl/CuonVector4";
import perfAnalyse from "../../lib/perf_analyse/PerfAnalyse";

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

    public override componentDidMount () {
        this.componentDidUpdate();
    }

    /**
     * 变换矩阵的实例
     */
    private _vpMatrix = new CuonMatrix4();

    public override componentDidUpdate () {
        if (this.canvas == null) {
            return;
        };
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
        this.DrawBgGrid();
        this.DrawBlock();
        this.DrawLightArea();
        this.DrawLightPoint();
        this.DrawTouch();
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
     * 绘制方块
     */
    DrawBlock () {
        // 都有哪些格子是已占用了的，记录一下
        let locRec: Map<number, Map<number, boolean>> = new Map();
        // 绘制背景颜色
        for (let xI = 0; xI < root.store.getState().blockXRec.length; xI++) {
            let xRec = root.store.getState().blockXRec[xI];
            locRec.set(xRec.gridX, new Map());
            for (let yI = 0; yI < xRec.yCollect.length; yI++) {
                let yRec = xRec.yCollect[yI];
                locRec.get(xRec.gridX).set(yRec.gridY, true);
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
            if (!locRec.has(gridX)) {
                return false;
            };
            if (!locRec.get(gridX).has(gridY)) {
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

    _lightDataList: LightAreaRec[] = [];

    /**
     * 绘制光照范围
     */
    DrawLightArea () {
        // 穷举所有光源
        for (let lightXI = 0; lightXI < root.store.getState().lightXRec.length; lightXI++) {
            let lightXRec = root.store.getState().lightXRec[lightXI];
            for (let lightYI = 0; lightYI < lightXRec.yCollect.length; lightYI++) {
                let lightYRec = lightXRec.yCollect[lightYI];

                // 先清空记录
                this._lightDataList.length = 0;

                // 光源的中心位置
                let blockCenterX = (lightXRec.gridX + 0.5) * config.rectSize;
                let blockCenterY = (lightYRec.gridY + 0.5) * config.rectSize;

                // 线段处理器
                let lineAddition = (
                    x1: number,
                    y1: number,
                    x2: number,
                    y2: number
                ) => {
                    // 线段的正前方
                    let forward = CuonVector3.CreateByXY(
                        x2 - x1,
                        y2 - y1
                    );
                    // 线段的正右方
                    let right = forward.GetRight();
                    // 点 1 到光源
                    let pos1ToLight = CuonVector3.CreateByXY(
                        blockCenterX - x1,
                        blockCenterY - y1
                    );
                    // 取得点积
                    let dot = CuonVector3.Dot(right, pos1ToLight);
                    // 没有向着光源，忽略
                    if (dot < 0) {
                        return;
                    };
                    // 点 1
                    let angle1 = Math.atan2(y1 - blockCenterY, x1 - blockCenterX) / Math.PI * 180;
                    let distance1 = Math.sqrt((x1 - blockCenterX) ** 2 + (y1 - blockCenterY) ** 2);
                    // 确保都是正数
                    while (angle1 < 0) {
                        angle1 += 360;
                    };
                    // 点 2
                    let angle2 = Math.atan2(y2 - blockCenterY, x2 - blockCenterX) / Math.PI * 180;
                    let distance2 = Math.sqrt((x2 - blockCenterX) ** 2 + (y2 - blockCenterY) ** 2);
                    // 确保都是正数
                    while (angle2 < 0) {
                        angle2 += 360;
                    };
                    // 更正大小
                    if (angle1 < angle2) {
                        angle1 += 360;
                    };
                    // 如果过了 360，分成俩个部分
                    if (360 < angle1) {
                        // 360 度对应的距离
                        let distance360 = this.GetDistance(
                            angle1,
                            distance1,
                            angle2,
                            distance2,
                            360
                        );
                        // 记录起来-小于 360 的部分
                        this._lightDataList.push({
                            pointFrom: {
                                angle: angle2,
                                distance: distance2
                            },
                            pointTo: {
                                angle: 360,
                                distance: distance360
                            }
                        });
                        // 记录起来-大于 360 的部分
                        this._lightDataList.push({
                            pointFrom: {
                                angle: 0,
                                distance: distance360
                            },
                            pointTo: {
                                angle: angle1 - 360,
                                distance: distance1
                            }
                        });
                    }
                    else {
                        // 记录起来
                        this._lightDataList.push({
                            pointFrom: {
                                angle: angle2,
                                distance: distance2
                            },
                            pointTo: {
                                angle: angle1,
                                distance: distance1
                            }
                        });
                    };
                };

                // 穷举所有方块
                for (let blockXI = 0; blockXI < root.store.getState().blockXRec.length; blockXI++) {
                    let blockXRec = root.store.getState().blockXRec[blockXI];
                    for (let blockYI = 0; blockYI < blockXRec.yCollect.length; blockYI++) {
                        let blockYRec = blockXRec.yCollect[blockYI];

                        // 求得 4 个方位的边界
                        let posLeft = blockXRec.gridX * config.rectSize;
                        let posRight = (blockXRec.gridX + 1) * config.rectSize;
                        let posBottom = blockYRec.gridY * config.rectSize;
                        let posTop = (blockYRec.gridY + 1) * config.rectSize;

                        // 左下->右下
                        lineAddition(
                            posLeft,
                            posBottom,
                            posRight,
                            posBottom
                        );
                        // // 右下->右上
                        lineAddition(
                            posRight,
                            posBottom,
                            posRight,
                            posTop
                        );
                        // // 右上->左上
                        lineAddition(
                            posRight,
                            posTop,
                            posLeft,
                            posTop
                        );
                        // 左上->左下
                        lineAddition(
                            posLeft,
                            posTop,
                            posLeft,
                            posBottom
                        );
                    };
                };

                // 周长
                let cycleLen = 2 * Math.PI * config.lightDistance;
                // 单元数量
                let unitCount = Math.ceil(cycleLen / config.rectSize);
                // 每个单元长度
                let unitLen = cycleLen / unitCount;
                // 每个单元角度
                let unitAngle = 360 / unitCount;
                // 当前方向向量
                let vec = new CuonVector3();
                vec.elements[1] = unitLen;
                // 初始化旋转矩阵
                let rotate = new CuonMatrix4();
                rotate.setRotate(unitAngle, 0, 0, 1);
                // 起始位置
                let currPos = [config.lightDistance, 0];
                for (let i = 0; i < unitCount; i++) {
                    // 当前末端
                    let tempPos = [currPos[0] + vec.elements[0], currPos[1] + vec.elements[1]];
                    // 角度继续偏转
                    vec = rotate.multiplyVector3(vec);
                    // 加入光照图
                    lineAddition(
                        tempPos[0] + blockCenterX,
                        tempPos[1] + blockCenterY - unitLen / 2,
                        currPos[0] + blockCenterX,
                        currPos[1] + blockCenterY - unitLen / 2
                    );
                    // 更新末端
                    currPos = tempPos;
                };
                // 按距离进行排序
                this._lightDataList.sort(( areaA, areaB ) => {
                    return (areaA.pointFrom.distance + areaA.pointTo.distance) - (areaB.pointFrom.distance + areaB.pointTo.distance);
                });
                // 用于穷举的集合
                let walker = [...this._lightDataList];
                // 临时的集合
                let tempList: LightAreaRec[] = [];
                // 让集合留空
                this._lightDataList.length = 0;
                
                // 穷举全部
                while (0 < walker.length) {
                    // 每次提取首个
                    let areaNearBy = walker.shift();
                    // 添加进渲染列表
                    this._lightDataList.push(areaNearBy);
                    // 清空临时列表
                    tempList.length = 0;
                    // 用这一个，切割其余的
                    for (let walkI = 0; walkI < walker.length; walkI++) {
                        let areaElse = walker[walkI];
                        // 如果该项完全被遮挡，那么忽略它
                        if (areaNearBy.pointFrom.angle <= areaElse.pointFrom.angle && areaElse.pointTo.angle <= areaNearBy.pointTo.angle) {
                            continue;
                        };

                        // 不存在遮挡的话，保留下来
                        if (
                            areaElse.pointTo.angle <= areaNearBy.pointFrom.angle
                            || areaNearBy.pointTo.angle <= areaElse.pointFrom.angle    
                        ) 
                        {
                            tempList.push( areaElse );
                            continue;
                        };

                        // 保留左方的突出内容
                        if (areaElse.pointFrom.angle <= areaNearBy.pointFrom.angle && areaNearBy.pointFrom.angle <= areaElse.pointTo.angle) {
                            let distance = this.GetDistance(
                                areaElse.pointFrom.angle,
                                areaElse.pointFrom.distance,
                                areaElse.pointTo.angle,
                                areaElse.pointTo.distance,
                                areaNearBy.pointFrom.angle
                            );
                            tempList.push({
                                pointFrom: areaElse.pointFrom,
                                pointTo: {
                                    angle: areaNearBy.pointFrom.angle,
                                    distance: distance
                                }
                            })
                        };

                        // 保留右方的突出内容
                        if (areaElse.pointFrom.angle <= areaNearBy.pointTo.angle && areaNearBy.pointTo.angle <= areaElse.pointTo.angle) {
                            let distance = this.GetDistance(
                                areaElse.pointFrom.angle,
                                areaElse.pointFrom.distance,
                                areaElse.pointTo.angle,
                                areaElse.pointTo.distance,
                                areaNearBy.pointTo.angle
                            );
                            tempList.push({
                                pointFrom: {
                                    angle: areaNearBy.pointTo.angle,
                                    distance: distance
                                },
                                pointTo: areaElse.pointTo
                            });
                        };
                    };
                    // 更新 walker 为切割后的内容
                    walker.length = 0;
                    walker.push(...tempList);
                };

                // 对残留的每个区域进行 3 角形绘制
                for (let areaI = 0; areaI < this._lightDataList.length; areaI++) {
                    let currArea = this._lightDataList[areaI];
                    // 忽略掉非法数据
                    if (currArea.pointTo.angle <= currArea.pointFrom.angle) {
                        continue;
                    };
                    this.vertexNumberData.length = 0;
                    let fromRate = (1 - currArea.pointFrom.distance / config.lightDistance);
                    let toRate = (1 - currArea.pointTo.distance / config.lightDistance);
                    this.vertexNumberData.push(
                        Math.cos(currArea.pointFrom.angle / 180 * Math.PI) * currArea.pointFrom.distance + blockCenterX, 
                        Math.sin(currArea.pointFrom.angle / 180 * Math.PI) * currArea.pointFrom.distance + blockCenterY, 
                        0,
                        config.lightAreaColor[0],
                        config.lightAreaColor[1],
                        config.lightAreaColor[2],
                        fromRate * config.lightAreaColor[3],

                        Math.cos(currArea.pointTo.angle / 180 * Math.PI) * currArea.pointTo.distance + blockCenterX, 
                        Math.sin(currArea.pointTo.angle / 180 * Math.PI) * currArea.pointTo.distance + blockCenterY, 
                        0,
                        config.lightAreaColor[0],
                        config.lightAreaColor[1],
                        config.lightAreaColor[2],
                        toRate * config.lightAreaColor[3],

                        blockCenterX,
                        blockCenterY,
                        0,
                        config.lightAreaColor[0],
                        config.lightAreaColor[1],
                        config.lightAreaColor[2],
                        config.lightAreaColor[3]
                    );
                    // 逐个地把 3 角形给绘制出来
                    this.DrawByElementData(
                        this.vertexNumberData,
                        this.shapeTriangleFill,
                        WebGLRenderingContext.TRIANGLES
                    );
                };
            };
        };
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
    GetDistance (
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
        // (cosAngle * d - p2[0]) * right.elements[0] + (sinAngle * d - p2[1]) * right.elements[1] = 0
        // d * cosAngle * right.elements[0] - p2[0] * right.elements[0] + d * sinAngle * right.elements[1] - p2[1] * right.elements[1] = 0;
        return (p2[0] * right.elements[0] + p2[1] * right.elements[1]) / (cosAngle * right.elements[0] + sinAngle * right.elements[1]);
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