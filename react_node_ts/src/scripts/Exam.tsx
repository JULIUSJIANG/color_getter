import React from "react";
import CuonMatrix4 from "../lib/webgl/CuonMatrix4";
import cuonUtils from "../lib/webgl/CuonUtils";

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

export class Exam extends React.Component {
    public override componentDidMount () {
        let canvas = document.getElementsByTagName(`canvas`)[0];
        let gl = cuonUtils.getWebGLContext(canvas);
        let program = cuonUtils.createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE)
        gl.useProgram(program);
        if (!program) {
            console.error(`Failed to initialize shaders`);
            return;
        };
        
        let n: number = 0;
        // 设置顶点坐标和颜色
        initVertexBuffers();
        
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
        mvpMatrix.setPerspective(30, 1, 1, 100);
        mvpMatrix.lookAt(3, 3, 7, 0, 0, 0, 0, 1, 0);

        // 设置视点和视线
        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

        // 清空颜色缓冲区和深度缓冲区
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // 绘制三角形
        gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
        
        function initVertexBuffers () {
            // 坐标、颜色
            let verticesColors = new Float32Array([
                // Vertex coordinates and color
                 1.0,  1.0,  1.0,     1.0,  1.0,  1.0,  // v0 White
                -1.0,  1.0,  1.0,     1.0,  0.0,  1.0,  // v1 Magenta
                -1.0, -1.0,  1.0,     1.0,  0.0,  0.0,  // v2 Red
                 1.0, -1.0,  1.0,     1.0,  1.0,  0.0,  // v3 Yellow
                 1.0, -1.0, -1.0,     0.0,  1.0,  0.0,  // v4 Green
                 1.0,  1.0, -1.0,     0.0,  1.0,  1.0,  // v5 Cyan
                -1.0,  1.0, -1.0,     0.0,  0.0,  1.0,  // v6 Blue
                -1.0, -1.0, -1.0,     0.0,  0.0,  0.0   // v7 Black
            ]);

            // 顶点索引
            let indices = new Uint8Array([
                0, 1, 2,   0, 2, 3,    // front
                0, 3, 4,   0, 4, 5,    // right
                0, 5, 6,   0, 6, 1,    // up
                1, 6, 7,   1, 7, 2,    // left
                7, 4, 3,   7, 3, 2,    // down
                4, 7, 6,   4, 6, 5     // back
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

            n = indices.length;
        };
    }

    public override render () {
        return (
            <canvas width="400" height="400">
            </canvas>
        );
    } 
}