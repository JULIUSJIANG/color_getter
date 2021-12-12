import React from "react";
import CuonMatrix4 from "../../lib/webgl/CuonMatrix4";
import cuonUtils from "../../lib/webgl/CuonUtils";
import rootConfig from "../RootConfig";
import RootState from "../RootState";
import colorFragment from "../shader/ColorFragment";
import colorVertex from "../shader/ColorVertex";
import TouchMachine from "../touchmachine/TouchMachine";
import {Dispatch} from 'redux';
import {connect} from 'react-redux';
import rootAction from "../RootAction";

/**
 * 绘制-主内容
 */
class Component extends React.Component<IProps> {
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

    public constructor (props: IProps) {
        super(props);
        window.onresize = () => {
            this.props.reloadWebgl();
        };
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
            -this.props.value.cameraX,
            -this.props.value.cameraY,
            0
        );
        this.DrawBgGrid();
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
     * 绘制背景格子
     */
    DrawBgGrid () {
        let left = this.props.value.cameraX - window.innerWidth / 2;
        let right = this.props.value.cameraX + window.innerWidth / 2;
        let bottom = this.props.value.cameraY - window.innerHeight / 2;
        let top = this.props.value.cameraY + window.innerHeight / 2;
        // 水平方向
        let horPosArray: number[] = [];
        let horPos = Math.floor( right / rootConfig.rectSize ) * rootConfig.rectSize;
        while (left < horPos) {
            horPosArray.unshift(horPos);
            horPos -= rootConfig.rectSize;
        };
        let horLeft = horPosArray[0] - rootConfig.rectSize;
        let horRight = horPosArray[horPosArray.length - 1] + rootConfig.rectSize;
        // 垂直方向
        let verPosArray: number[] = [];
        let verPos = Math.floor( top / rootConfig.rectSize ) * rootConfig.rectSize;
        while (bottom < verPos) {
            verPosArray.unshift(verPos);
            verPos -= rootConfig.rectSize;
        };
        let verBottom = verPosArray[0] - rootConfig.rectSize;
        let verTop = verPosArray[verPosArray.length - 1] + rootConfig.rectSize;

        this.vertexNumberData.length = 0;
        for (let horIndex = 0; horIndex < horPosArray.length; horIndex++) {
            let x = horPosArray[horIndex];
            this.vertexNumberData.push(
                x, verBottom, rootConfig.bgGridZ, rootConfig.gridColor.r, rootConfig.gridColor.g, rootConfig.gridColor.b,
                x, verTop, rootConfig.bgGridZ, rootConfig.gridColor.r, rootConfig.gridColor.g, rootConfig.gridColor.b
            );
            if (x == 0) {
                this.vertexNumberData.push(
                    x, 0, rootConfig.xyZ, rootConfig.xColor.r, rootConfig.xColor.g, rootConfig.xColor.b,
                    x, verTop, rootConfig.xyZ, rootConfig.xColor.r, rootConfig.xColor.g, rootConfig.xColor.b
                );
            };
        };

        // 所有横线
        for (let verIndex = 0; verIndex < verPosArray.length; verIndex++) {
            let y = verPosArray[verIndex];
            this.vertexNumberData.push(
                horLeft, y, rootConfig.bgGridZ, rootConfig.gridColor.r, rootConfig.gridColor.g, rootConfig.gridColor.b,
                horRight, y, rootConfig.bgGridZ, rootConfig.gridColor.r, rootConfig.gridColor.g, rootConfig.gridColor.b
            );
            if (y == 0) {
                this.vertexNumberData.push(
                    0, y, rootConfig.xyZ, rootConfig.yColor.r, rootConfig.yColor.g, rootConfig.yColor.b,
                    horRight, y, rootConfig.xyZ, rootConfig.yColor.r, rootConfig.yColor.g, rootConfig.yColor.b
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
        this.vertexNumberData.length = 0;
        let left = this.props.value.focusGridX * rootConfig.rectSize;
        let right = (this.props.value.focusGridX + 1) * rootConfig.rectSize;
        let bottom = this.props.value.focusGridY * rootConfig.rectSize;
        let top = (this.props.value.focusGridY + 1) * rootConfig.rectSize;
        let colorObj = TouchMachine.inst.isPressed ? rootConfig.focusFramePressColor : rootConfig.focusFrameReleaseColor;
        this.vertexNumberData.push(
            left, bottom, rootConfig.focusFrameZ, colorObj.r, colorObj.g, colorObj.b,
            right, bottom, rootConfig.focusFrameZ, colorObj.r, colorObj.g, colorObj.b,
            right, top, rootConfig.focusFrameZ, colorObj.r, colorObj.g, colorObj.b,
            left, top, rootConfig.focusFrameZ, colorObj.r, colorObj.g, colorObj.b,
        );

        this.shapeNumberData.length = 0;
        this.shapeNumberData.push(
            0, 1,
            1, 2,
            2, 3,
            3, 0
        );

        this.DrawByElementData(
            this.vertexNumberData,
            this.shapeNumberData,
            WebGLRenderingContext.LINES
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
                    TouchMachine.Init(this.canvas);
                    this.gl = cuonUtils.getWebGLContext(ref);
                    this.program = cuonUtils.createProgram(this.gl, colorVertex.shader, colorFragment.shader);
                    this.vbuffer = this.gl.createBuffer();
                    this.iBuffer = this.gl.createBuffer();
                    this.attlocPos = this.gl.getAttribLocation(this.program, colorVertex.attNamePos);
                    this.attlocColor = this.gl.getAttribLocation(this.program, colorVertex.attNameColor);
                    this.attlocMvpMat = this.gl.getUniformLocation(this.program, colorVertex.attNameMvpMat);
                    this.gl.clearColor(
                        rootConfig.bgColor.r,
                        rootConfig.bgColor.g,
                        rootConfig.bgColor.b,
                        rootConfig.bgColor.a
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

interface IProps {
    value: RootState,
    reloadWebgl: () => void;
}

const mapStateToProps = (state: RootState) => ({
    value: state
});
const mapDispatchToProps = (dispatch: Dispatch) => ({
    reloadWebgl: () => {
        dispatch(rootAction.reLoadWebgl());
    }
});

const WebglMain = connect(mapStateToProps, mapDispatchToProps)(Component);
export default WebglMain;