import React from "react";
import CuonMatrix4 from "../../lib/webgl/CuonMatrix4";
import cuonUtils from "../../lib/webgl/CuonUtils";
import config from "../Config";
import colorFragment from "../shader/ColorFragment";
import colorVertex from "../shader/ColorVertex";
import TouchMachine from "../touchmachine/TouchMachine";
import {Dispatch} from 'redux';
import {connect} from 'react-redux';
import root from "../Root";

/**
 * 绘制-主内容
 */
class Component extends React.Component {
    /**
     * 画布
     */
    public canvas?: HTMLCanvasElement;

    /**
     * webgl 上下文
     */
    public gl?: WebGLRenderingContext;

    /**
     * 着色程序
     */
    public program?: WebGLProgram;

    /**
     * 顶点数据缓冲区
     */
    public vbuffer?: WebGLBuffer;

    /**
     * 绘制点的缓冲区
     */
    public iBuffer?: WebGLBuffer;

    /**
     * 内存位置-顶点坐标
     */
    public attlocPos?: GLint;

    /**
     * 内存位置-顶点颜色
     */
    public attlocColor?: GLint;

    /**
     * 内存位置-mvp 矩阵
     */
    public attlocMvpMat?: WebGLUniformLocation;

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
        this.shapeNumberData.length = 0;
        this.shapeNumberData.push(
            0, 1, 2,
            0, 2, 3
        );
        this.DrawTouch();
        this.DrawBlock();
        this.DrawLight();
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
                x, verBottom, config.bgGridZ, config.gridColor[0], config.gridColor[1], config.gridColor[2],
                x, verTop, config.bgGridZ, config.gridColor[0], config.gridColor[1], config.gridColor[2]
            );
            if (x == 0) {
                this.vertexNumberData.push(
                    x, 0, config.xyZ, config.xColor[0], config.xColor[1], config.xColor[2],
                    x, verTop, config.xyZ, config.xColor[0], config.xColor[1], config.xColor[2]
                );
            };
        };

        // 所有横线
        for (let verIndex = 0; verIndex < verPosArray.length; verIndex++) {
            let y = verPosArray[verIndex];
            this.vertexNumberData.push(
                horLeft, y, config.bgGridZ, config.gridColor[0], config.gridColor[1], config.gridColor[2],
                horRight, y, config.bgGridZ, config.gridColor[0], config.gridColor[1], config.gridColor[2]
            );
            if (y == 0) {
                this.vertexNumberData.push(
                    0, y, config.xyZ, config.yColor[0], config.yColor[1], config.yColor[2],
                    horRight, y, config.xyZ, config.yColor[0], config.yColor[1], config.yColor[2]
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
            config.focusFrameZ,
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
                    config.blockBgZ,
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
                        config.blockPaddingZ,
                        config.blockPaddingColor
                    );
                });
            };
        };
    }
    
    /**
     * 绘制光源
     */
    DrawLight () {
        // 绘制背景颜色
        for (let xI = 0; xI < root.store.getState().lightXRec.length; xI++) {
            let xRec = root.store.getState().lightXRec[xI];
            for (let yI = 0; yI < xRec.yCollect.length; yI++) {
                let yRec = xRec.yCollect[yI];

                this.DrawRectFill(
                    xRec.gridX,
                    yRec.gridY,
                    config.lightBgZ,
                    config.lightPaddingColor,
                    (config.rectSize - config.lightSize) / 2
                );

                this.DrawRectFill(
                    xRec.gridX,
                    yRec.gridY,
                    config.lightBodyZ,
                    config.lightBgColor,
                    (config.rectSize - config.lightSize) / 2 + config.lightPadding
                );
            };
        };
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
            left + size, top, z, color[0], color[1], color[2],
            left, top, z, color[0], color[1], color[2],
            left, bottom, z, color[0], color[1], color[2],
            left + size, bottom, z, color[0], color[1], color[2],
        );
        this.DrawByElementData(
            this.vertexNumberData,
            this.shapeNumberData,
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
            right, top, z, color[0], color[1], color[2],
            right - size, top, z, color[0], color[1], color[2],
            right - size, bottom, z, color[0], color[1], color[2],
            right, bottom, z, color[0], color[1], color[2],
        );
        this.DrawByElementData(
            this.vertexNumberData,
            this.shapeNumberData,
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
            right, bottom + size, z, color[0], color[1], color[2],
            left, bottom + size, z, color[0], color[1], color[2],
            left, bottom, z, color[0], color[1], color[2],
            right, bottom, z, color[0], color[1], color[2],
        );
        this.DrawByElementData(
            this.vertexNumberData,
            this.shapeNumberData,
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
            right, top, z, color[0], color[1], color[2],
            left, top, z, color[0], color[1], color[2],
            left, top - size, z, color[0], color[1], color[2],
            right, top - size, z, color[0], color[1], color[2],
        );
        this.DrawByElementData(
            this.vertexNumberData,
            this.shapeNumberData,
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
            right, top, z, color[0], color[1], color[2],
            right - size, top, z, color[0], color[1], color[2],
            right - size, top - size, z, color[0], color[1], color[2],
            right, top - size, z, color[0], color[1], color[2],
        );
        this.DrawByElementData(
            this.vertexNumberData,
            this.shapeNumberData,
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
            left + size, top, z, color[0], color[1], color[2],
            left, top, z, color[0], color[1], color[2],
            left, top - size, z, color[0], color[1], color[2],
            left + size, top - size, z, color[0], color[1], color[2],
        );
        this.DrawByElementData(
            this.vertexNumberData,
            this.shapeNumberData,
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
            left + size, bottom + size, z, color[0], color[1], color[2],
            left, bottom + size, z, color[0], color[1], color[2],
            left, bottom, z, color[0], color[1], color[2],
            left + size, bottom, z, color[0], color[1], color[2],
        );
        this.DrawByElementData(
            this.vertexNumberData,
            this.shapeNumberData,
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
            right, bottom + size, z, color[0], color[1], color[2],
            right - size, bottom + size, z, color[0], color[1], color[2],
            right - size, bottom, z, color[0], color[1], color[2],
            right, bottom, z, color[0], color[1], color[2],
        );
        this.DrawByElementData(
            this.vertexNumberData,
            this.shapeNumberData,
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
            right, top, z, color[0], color[1], color[2],
            left, top, z, color[0], color[1], color[2],
            left, bottom, z, color[0], color[1], color[2],
            right, bottom, z, color[0], color[1], color[2],
        );
        this.DrawByElementData(
            this.vertexNumberData,
            this.shapeNumberData,
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
        this.gl.vertexAttribPointer(this.attlocPos, 3, this.gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 6, 0);
        this.gl.enableVertexAttribArray(this.attlocPos);

        // 填充颜色数据
        this.gl.vertexAttribPointer(this.attlocColor, 3, this.gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 6, Float32Array.BYTES_PER_ELEMENT * 3);
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
                    this.gl.enable(this.gl.DEPTH_TEST);
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
        )
    }
}

const Webgl = connect(state => state)(Component);
export default Webgl;