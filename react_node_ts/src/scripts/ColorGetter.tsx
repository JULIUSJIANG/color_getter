import React from "react";
import { Slider, Switch } from 'antd';
import CuonMatrix4 from "../lib/webgl/CuonMatrix4";
import cuonUtils from "../lib/webgl/CuonUtils";
import CuonVector3 from "../lib/webgl/CuonVector3";

// 顶点着色器
let VSHADER_SOURCE = 
`
attribute vec4 a_Position;
attribute vec4 a_Color;
uniform mat4 u_MvpMatrix;
varying vec4 v_Color;
void main () {
    gl_Position = u_MvpMatrix * a_Position;
    v_Color = a_Color;
}
`;

// 片元着色器
let FSHADER_SOURCE = 
`
#ifdef GL_ES
precision mediump float;
#endif
varying vec4 v_Color;
void main () {
    gl_FragColor = v_Color;
}
`;

// 立方体边长
const CUBE_SIDE_LENGTH = 1;

/**
 * 拾色器
 */
export default class ColorGetter extends React.Component{
    /**
     * webgl 对象
     */
    gl: WebGLRenderingContext = null as any;

    /**
     * 着色程序
     */
    program: WebGLProgram = null as any;

    /**
     * 顶点数据
     */
    verticesColors: Float32Array = null as any;

    /**
     * 绘制点的排列表
     */
    indices: Uint8Array = null as any;

    /**
     * 绘制点的派列表的缓冲区
     */
    indexBuffer: WebGLBuffer = null as any;

    /**
     * mvp 在内存中的位置
     */
    u_MvpMatrix: WebGLUniformLocation = null as any;

    /**
     * 模型、视图、投影矩阵
     */
    mvpMatrix: CuonMatrix4 = null as any;

    /**
     * 顶点数据的缓冲区
     */
    vertexColorBuffer: WebGLBuffer = null as any;

    /**
     * 着色属性—位置
     */
    a_Position: number = 0;

    /**
     * 着色属性—颜色
     */
    a_Color: number = 0;

    /**
     * 着色元数据的尺寸
     */
    FSIZE: number = 0;

    public override componentDidMount () {
        let canvas = document.getElementsByTagName(`canvas`)[0];
        this.gl = cuonUtils.getWebGLContext(canvas);
        this.program = cuonUtils.createProgram(this.gl, VSHADER_SOURCE, FSHADER_SOURCE);
        
        if (!this.program) {
            console.error(`Failed to initialize shaders`);
            return;
        };

        // 坐标、颜色
        this.verticesColors = new Float32Array([
            // Vertex coordinates and color
             CUBE_SIDE_LENGTH / 2,  CUBE_SIDE_LENGTH / 2,  CUBE_SIDE_LENGTH / 2,     0.0, 0.0, 0.0,  // v0 White
            -CUBE_SIDE_LENGTH / 2,  CUBE_SIDE_LENGTH / 2,  CUBE_SIDE_LENGTH / 2,     0.0, 0.0, 0.0,  // v1 Magenta
            -CUBE_SIDE_LENGTH / 2, -CUBE_SIDE_LENGTH / 2,  CUBE_SIDE_LENGTH / 2,     0.0, 0.0, 0.0,  // v2 Red
             CUBE_SIDE_LENGTH / 2, -CUBE_SIDE_LENGTH / 2,  CUBE_SIDE_LENGTH / 2,     0.0, 0.0, 0.0,  // v3 Yellow
             CUBE_SIDE_LENGTH / 2, -CUBE_SIDE_LENGTH / 2, -CUBE_SIDE_LENGTH / 2,     0.0, 0.0, 0.0,  // v4 Green
             CUBE_SIDE_LENGTH / 2,  CUBE_SIDE_LENGTH / 2, -CUBE_SIDE_LENGTH / 2,     0.0, 0.0, 0.0,  // v5 Cyan
            -CUBE_SIDE_LENGTH / 2,  CUBE_SIDE_LENGTH / 2, -CUBE_SIDE_LENGTH / 2,     0.0, 0.0, 0.0,  // v6 Blue
            -CUBE_SIDE_LENGTH / 2, -CUBE_SIDE_LENGTH / 2, -CUBE_SIDE_LENGTH / 2,     0.0, 0.0, 0.0,  // v7 Black
        ]);

        // 顶点索引
        this.indices = new Uint8Array([
            0, 1, 
            1, 2,
            2, 3,
            3, 0,

            4, 5,
            5, 6,
            6, 7,
            7, 4,

            0, 5,
            1, 6,
            2, 7,
            3, 4
        ]);

        // 创建顶点缓冲区对象
        this.vertexColorBuffer = this.gl.createBuffer() as WebGLBuffer;
        if (!this.vertexColorBuffer) {
            console.error(`Failed to create the buffer object`);
            return -1;
        };

        // 创建坐标信息缓冲区
        this.indexBuffer = this.gl.createBuffer() as WebGLBuffer;
        if (!this.indexBuffer) {
            console.error(`Failed to create the buffer object`);
            return -1;
        };

        // 记录元数据的尺寸
        this.FSIZE = this.verticesColors.BYTES_PER_ELEMENT;

        // 将缓冲区内顶点坐标数据分配给 a_Position 并开启之
        this.a_Position = this.gl.getAttribLocation(this.program, `a_Position`);
        if(this.a_Position < 0) {
            console.error('Failed to get the storage location of a_Position');
            return -1;
        };

        // 传入颜色
        this.a_Color = this.gl.getAttribLocation(this.program, `a_Color`);
        if (this.a_Color < 0) {
            console.error('Failed to get the storage location of a_Color');
            return -1;
        };

        // 设置背景颜色
        this.gl.clearColor(1, 1, 1, 1);
        this.gl.enable(this.gl.DEPTH_TEST);

        // 获取存储地址
        this.u_MvpMatrix = this.gl.getUniformLocation(this.program, `u_MvpMatrix`) as WebGLUniformLocation;
        if (!this.u_MvpMatrix) { 
            console.error('Failed to get the storage location of u_MvpMatrix');
            return;
        };

        // 创建矩阵实例
        this.mvpMatrix = new CuonMatrix4();

        // 计算出恰好满足需要的远裁切平面
        let watchDepth = Math.sqrt(CUBE_SIDE_LENGTH ** 2 * 3);

        // 计算出裁切高度
        this.mvpMatrix.setLookAt(CUBE_SIDE_LENGTH / 2, CUBE_SIDE_LENGTH / 2, CUBE_SIDE_LENGTH / 2, 0, 0, 0, 0, 1, 0);
        let anglePoint = new CuonVector3();
        anglePoint.elements[0] = - CUBE_SIDE_LENGTH / 2;
        anglePoint.elements[1] = CUBE_SIDE_LENGTH / 2;
        anglePoint.elements[2] = -CUBE_SIDE_LENGTH / 2;
        anglePoint = this.mvpMatrix.multiplyVector3(anglePoint);

        // 设置正交裁切面
        let watchSideLenght = anglePoint.elements[1];
        this.mvpMatrix.setOrtho(-watchSideLenght, watchSideLenght, -watchSideLenght, watchSideLenght,  0, watchDepth);
        this.mvpMatrix.lookAt(CUBE_SIDE_LENGTH / 2, CUBE_SIDE_LENGTH / 2, CUBE_SIDE_LENGTH / 2, 0, 0, 0, 0, 1, 0);

        // 进行一次绘制
        this.drawCube();
    }

    public override componentDidUpdate () {
        // 及时更新
        this.drawCube();
    }

    /**
     * 把立方体绘制出来
     */
    drawCube () {
        // 清空颜色缓冲区和深度缓冲区
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        // 使用某个应用程序
        this.gl.useProgram(this.program);

        // 将缓冲区对象绑定到目标
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexColorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.verticesColors, this.gl.STATIC_DRAW);

        // 填充 a_Position 需要的数据
        this.gl.vertexAttribPointer(this.a_Position, 3, this.gl.FLOAT, false, this.FSIZE * 6, 0);
        this.gl.enableVertexAttribArray(this.a_Position);

        // 填充 a_Color 需要的数据
        this.gl.vertexAttribPointer(this.a_Color, 3, this.gl.FLOAT, false, this.FSIZE * 6, this.FSIZE * 3);
        this.gl.enableVertexAttribArray(this.a_Color);
    
        // 设置视点和视线
        this.gl.uniformMatrix4fv(this.u_MvpMatrix, false, this.mvpMatrix.elements);
        
        // 传入顶点索引数据
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indices, this.gl.STATIC_DRAW);

        // 绘制三角形
        this.gl.drawElements(this.gl.LINES, this.indices.length, this.gl.UNSIGNED_BYTE, 0);
    }

    public override render () {
        return (
            <div style={{width: `440px`, padding: `20px`, margin: `20px`, boxShadow: `2px 2px 5px #000`}}>
                <canvas width="400" height="400">
                </canvas>
                <Slider defaultValue={30} disabled={false} />
            </div>
        )
    }
}