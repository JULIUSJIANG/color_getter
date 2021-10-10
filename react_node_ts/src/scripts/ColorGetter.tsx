import React from "react";
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
    public override componentDidMount () {
        let canvas = document.getElementsByTagName(`canvas`)[0];
        let gl = cuonUtils.getWebGLContext(canvas);
        let program = cuonUtils.createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);
        gl.useProgram(program);
        if (!program) {
            console.error(`Failed to initialize shaders`);
            return;
        };

        // 坐标、颜色
        let verticesColors = new Float32Array([
            // Vertex coordinates and color
             CUBE_SIDE_LENGTH / 2,  CUBE_SIDE_LENGTH / 2,  CUBE_SIDE_LENGTH / 2,     1.0, 0.0, 0.0,  // v0 White
            -CUBE_SIDE_LENGTH / 2,  CUBE_SIDE_LENGTH / 2,  CUBE_SIDE_LENGTH / 2,     1.0, 0.0, 0.0,  // v1 Magenta
            -CUBE_SIDE_LENGTH / 2, -CUBE_SIDE_LENGTH / 2,  CUBE_SIDE_LENGTH / 2,     1.0, 0.0, 0.0,  // v2 Red
             CUBE_SIDE_LENGTH / 2, -CUBE_SIDE_LENGTH / 2,  CUBE_SIDE_LENGTH / 2,     1.0, 0.0, 0.0,  // v3 Yellow
             CUBE_SIDE_LENGTH / 2, -CUBE_SIDE_LENGTH / 2, -CUBE_SIDE_LENGTH / 2,     1.0, 0.0, 0.0,  // v4 Green
             CUBE_SIDE_LENGTH / 2,  CUBE_SIDE_LENGTH / 2, -CUBE_SIDE_LENGTH / 2,     1.0, 0.0, 0.0,  // v5 Cyan
            -CUBE_SIDE_LENGTH / 2,  CUBE_SIDE_LENGTH / 2, -CUBE_SIDE_LENGTH / 2,     1.0, 0.0, 0.0,  // v6 Blue
            -CUBE_SIDE_LENGTH / 2, -CUBE_SIDE_LENGTH / 2, -CUBE_SIDE_LENGTH / 2,     1.0, 0.0, 0.0,  // v7 Black
        ]);

        // 顶点索引
        let indices = new Uint8Array([
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
        let vertexColorBuffer = gl.createBuffer();
        if (!vertexColorBuffer) {
            console.error(`Failed to create the buffer object`);
            return -1;
        };

        // 创建坐标信息缓冲区
        let indexBuffer = gl.createBuffer();
        if (!indexBuffer) {
            console.error(`Failed to create the buffer object`);
            return -1;
        };

        // 将缓冲区对象绑定到目标
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

        let FSIZE = verticesColors.BYTES_PER_ELEMENT;
        // 将缓冲区内顶点坐标数据分配给 a_Position 并开启之
        let a_Position = gl.getAttribLocation(program, `a_Position`);
        if(a_Position < 0) {
            console.error('Failed to get the storage location of a_Position');
            return -1;
        };
        // 将缓冲区对象分配给 a_Position 变量
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
        // 连接 a_Position 变量与分配给它的缓冲区对象
        gl.enableVertexAttribArray(a_Position);

        // 传入颜色
        let a_Color = gl.getAttribLocation(program, `a_Color`);
        if (a_Color < 0) {
            console.error('Failed to get the storage location of a_Color');
            return -1;
        }
        gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
        gl.enableVertexAttribArray(a_Color);

        // 传入顶点索引数据
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        let n = indices.length;

        // 设置背景颜色
        gl.clearColor(0, 0, 0, 1);
        gl.enable(gl.DEPTH_TEST);

        // 获取存储地址
        let u_MvpMatrix = gl.getUniformLocation(program, `u_MvpMatrix`);
        if (!u_MvpMatrix) { 
            console.error('Failed to get the storage location of u_MvpMatrix');
            return;
        };

        // 创建矩阵实例
        let mvpMatrix = new CuonMatrix4();

        let watchDepth = Math.sqrt(CUBE_SIDE_LENGTH ** 2 * 3);
        Math.sqrt(CUBE_SIDE_LENGTH ** 2 + CUBE_SIDE_LENGTH ** 2);

        mvpMatrix.setLookAt(CUBE_SIDE_LENGTH / 2, CUBE_SIDE_LENGTH / 2, CUBE_SIDE_LENGTH / 2, 0, 0, 0, 0, 1, 0);
        let anglePoint = new CuonVector3();
        anglePoint.elements[0] = - CUBE_SIDE_LENGTH / 2;
        anglePoint.elements[1] = CUBE_SIDE_LENGTH / 2;
        anglePoint.elements[2] = -CUBE_SIDE_LENGTH / 2;
        anglePoint = mvpMatrix.multiplyVector3(anglePoint);

        let watchSideLenght = anglePoint.elements[1];
        mvpMatrix.setOrtho(-watchSideLenght, watchSideLenght, -watchSideLenght, watchSideLenght,  0, watchDepth);
        mvpMatrix.lookAt(CUBE_SIDE_LENGTH / 2, CUBE_SIDE_LENGTH / 2, CUBE_SIDE_LENGTH / 2, 0, 0, 0, 0, 1, 0);

        // 设置视点和视线
        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

        // 清空颜色缓冲区和深度缓冲区
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // 绘制三角形
        gl.drawElements(gl.LINES, n, gl.UNSIGNED_BYTE, 0);
    }

    public override render () {
        return (
            <canvas width="400" height="400">
            </canvas>
        )
    }
}