import React from "react";
import CuonMatrix4 from "../../lib/webgl/CuonMatrix4";
import cuonUtils from "../../lib/webgl/CuonUtils";
import RootComponet from "../RootComponent";
import rootConfig from "../RootConfig";
import colorFragment from "../shader/ColorFragment";
import colorVertex from "../shader/ColorVertex";

/**
 * 绘制-主内容
 */
export default class WebglMain extends React.Component {
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

    public override componentDidMount () {
        if (this.canvas == null) {
            return;
        };
        this.gl!.clear(WebGLRenderingContext.COLOR_BUFFER_BIT | WebGLRenderingContext.DEPTH_BUFFER_BIT);
        this.DrawBgGrid();
    }

    /**
     * 绘制背景格子
     */
    DrawBgGrid () {
        let left = RootComponet.inst.state.cameraX! - window.innerWidth / 2;
        let right = RootComponet.inst.state.cameraX! + window.innerWidth / 2;
        let bottom = RootComponet.inst.state.cameraY! - window.innerHeight / 2;
        let top = RootComponet.inst.state.cameraY! + window.innerHeight / 2;
        
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
        // 所有竖线
        let vertexNumberData: number[] = [];
        for (let horIndex = 0; horIndex < horPosArray.length; horIndex++) {
            let x = horPosArray[horIndex];
            vertexNumberData.push(...[
                x, verBottom, rootConfig.bgGridZ, 1, 1, 1,
                x, verTop, rootConfig.bgGridZ, 1, 1, 1
            ]);
            if (x == 0) {
                vertexNumberData.push(...[
                    x, 0, rootConfig.xyZ, 0, 1, 0,
                    x, verTop, 0, rootConfig.xyZ, 1, 0
                ]);
            };
        };

        // 所有横线
        for (let verIndex = 0; verIndex < verPosArray.length; verIndex++) {
            let y = verPosArray[verIndex];
            vertexNumberData.push(...[
                horLeft, y, rootConfig.bgGridZ, 1, 1, 1,
                horRight, y, rootConfig.bgGridZ, 1, 1, 1
            ]);
            if (y == 0) {
                vertexNumberData.push(...[
                    0, y, rootConfig.xyZ, 1, 0, 0,
                    horRight, y, rootConfig.xyZ, 1, 0, 0
                ]);
            };
        };
        // 生成顶点数据
        let vertexBufferData = new Float32Array(vertexNumberData);
        
        // 用于连线的数据
        let lineConnectNumberData: number[] = [];
        // 求得顶点数量
        let dotCount = vertexNumberData.length / 6;
        for (let dotI = 0; dotI < dotCount; dotI++) {
            lineConnectNumberData.push(dotI);
        };
        let lineConnectBufferData = new Uint8Array(lineConnectNumberData);

        this.DrawByElementData(
            vertexBufferData,
            lineConnectBufferData,
            WebGLRenderingContext.LINES
        );
    }
    
    /**
     * 通过顶点数据绘制图形
     * @param elementData 
     * @param vertexIndexData 
     * @param shaderType 
     */
    DrawByElementData (
        elementData: Float32Array,
        vertexIndexData: Uint8Array,
        shaderType: number
    )
    {
        // 创建矩阵实例
        let vpMatrix = new CuonMatrix4();
        // 设置为看向屏幕涉猎的所有地方
        vpMatrix.setOrtho(
            -window.innerWidth / 2,
            window.innerWidth / 2,
            -window.innerHeight / 2,
            window.innerHeight / 2,
            0,
            2
        );
        // 设置为看向原点
        vpMatrix.lookAt(
            0, 0, 1,
            0, 0, 0,
            0, 1, 0
        );
        // 设置偏移
        vpMatrix.translate(
            RootComponet.inst.state.cameraX!,
            RootComponet.inst.state.cameraY!,
            0
        );

        // 确定使用的着色器程序
        this.gl?.useProgram(this.program!);

        // 填充顶点数据
        this.gl?.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, this.vbuffer!);
        this.gl?.bufferData(WebGLRenderingContext.ARRAY_BUFFER, elementData, WebGLRenderingContext.STATIC_DRAW);

        // 填充坐标数据
        this.gl?.vertexAttribPointer(this.attlocPos!, 3, this.gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 6, 0);
        this.gl?.enableVertexAttribArray(this.attlocPos!);

        // 填充颜色数据
        this.gl?.vertexAttribPointer(this.attlocColor!, 3, this.gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 6, Float32Array.BYTES_PER_ELEMENT * 3);
        this.gl?.enableVertexAttribArray(this.attlocColor!);
        
        // 传入变换矩阵
        this.gl?.uniformMatrix4fv(this.attlocMvpMat!, false, vpMatrix.elements);

        // 传入顶点索引数据
        this.gl?.bindBuffer(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, this.iBuffer!);
        this.gl?.bufferData(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, vertexIndexData, WebGLRenderingContext.STATIC_DRAW);

        // 进行元素绘制
        this.gl?.drawElements(
            shaderType,
            vertexIndexData.length,
            WebGLRenderingContext.UNSIGNED_BYTE,
            0
        );
    }

    public override render () {
        return (
            <canvas 
                ref={(ref) => {
                    this.canvas = ref!;
                    if (this.canvas == null) {
                        return;
                    };
                    this.gl = cuonUtils.getWebGLContext(ref!);
                    this.program = cuonUtils.createProgram(this.gl!, colorVertex.shader, colorFragment.shader);
                    this.vbuffer = this.gl.createBuffer()!;
                    this.iBuffer = this.gl.createBuffer()!;
                    this.attlocPos = this.gl.getAttribLocation(this.program, colorVertex.attNamePos);
                    this.attlocColor = this.gl.getAttribLocation(this.program, colorVertex.attNameColor);
                    this.attlocMvpMat = this.gl.getUniformLocation(this.program, colorVertex.attNameMvpMat)!;
                    this.gl.clearColor(
                        rootConfig.bgColor.r,
                        rootConfig.bgColor.g,
                        rootConfig.bgColor.b,
                        rootConfig.bgColor.a
                    );
                    this.gl.enable(this.gl.DEPTH_TEST);
                }}
                width={window.innerWidth * 2}
                height={window.innerHeight * 2}
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