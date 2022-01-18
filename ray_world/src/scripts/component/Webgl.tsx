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
import ObjectPool from "../../lib/object_pool/ObjectPool";

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
        perfAnalyse.Rec(`DrawLightPoint`);
        this.DrawLightPoint();
        perfAnalyse.Rec(`DrawLightArea`);
        this.DrawLightArea();
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
        // 地图字典
        let gridMap: Map<number, Map<number, boolean>> = new Map();
        // 绘制边缘颜色
        for (let xI = 0; xI < root.store.getState().blockXRec.length; xI++) {
            let xRec = root.store.getState().blockXRec[xI];
            for (let yI = 0; yI < xRec.yCollect.length; yI++) {
                let yRec = xRec.yCollect[yI];
                // 记录所有位置的格子
                if (!gridMap.has(xRec.gridX)) {
                    gridMap.set(xRec.gridX, new Map());
                };
                gridMap.get(xRec.gridX).set(yRec.gridY, true);
            };
        };
    }

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

        let right = p12.GetRight(new CuonVector3());
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