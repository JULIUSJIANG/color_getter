import React from "react";
import CuonMatrix4 from "../lib/webgl/CuonMatrix4";
import cuonUtils from "../lib/webgl/CuonUtils";
import CuonVector3 from "../lib/webgl/CuonVector3";
import globalConfig from "./GlobalConfig";
import { GlobalState } from "./GlobalState";
import TouchMachine from "./touch_machine/TouchMachine";

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

/**
 * 拾色器
 */
export default class ColorGetter extends React.Component<{}, GlobalState> {
    /**
     * 交互状态机
     */
    machine: TouchMachine = null as any;
    /**
     * webgl 对象
     */
    gl: WebGLRenderingContext = null as any;

    /**
    * 着色程序
    */
    program: WebGLProgram = null as any;

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
    vpMatrix: CuonMatrix4 = null as any;

    /**
     * mvp 逆矩阵
     */
    vpR: CuonMatrix4 = null as any;

    /**
     * 拖拽矩阵
     */
    dragCubeMvpMatrix: CuonMatrix4 = null as any;

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
     * 画布
     */
    canvas: HTMLCanvasElement = null as any;

    /**
     * 相机方向
     */
    cameraVec: CuonVector3 = null as any;

    public constructor(p: {}) {
        super(p);

        this.machine = new TouchMachine(this);
        this.state = {
            xEnable: false,
            yEnable: false,
            zEnable: false,

            xDrag: false,
            yDrag: false,
            zDrag: false,

            posX: 0,
            posY: 0,
            posZ: 0
        };
    }

    public override componentDidMount() {
        this.canvas = document.getElementsByTagName(`canvas`)[0];
        this.gl = cuonUtils.getWebGLContext(this.canvas);

        // 生成着色程序
        this.program = cuonUtils.createProgram(this.gl, VSHADER_SOURCE, FSHADER_SOURCE);
        if (!this.program) {
            console.error(`Failed to initialize shaders`);
            return;
        };

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

        // 将缓冲区内顶点坐标数据分配给 a_Position 并开启之
        this.a_Position = this.gl.getAttribLocation(this.program, `a_Position`);
        if (this.a_Position < 0) {
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
        this.gl.clearColor(0.16862745098039217, 0.16862745098039217, 0.16862745098039217, 1);
        this.gl.enable(this.gl.DEPTH_TEST);

        // 获取存储地址
        this.u_MvpMatrix = this.gl.getUniformLocation(this.program, `u_MvpMatrix`) as WebGLUniformLocation;
        if (!this.u_MvpMatrix) {
            console.error('Failed to get the storage location of u_MvpMatrix');
            return;
        };

        // 创建矩阵实例
        this.vpMatrix = new CuonMatrix4();

        // 计算出恰好满足需要的远裁切平面
        let watchDepth = Math.sqrt(globalConfig.FRAME_CUBE_SIDE_LENGTH ** 2 * 3);

        // 得到 mv 矩阵
        this.vpMatrix.setLookAt(globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, 0, 0, 0, 0, 1, 0);
        let anglePoint = new CuonVector3();

        // 求囊括立方体的上下边界
        anglePoint.elements[0] = - globalConfig.FRAME_CUBE_SIDE_LENGTH / 2;
        anglePoint.elements[1] = globalConfig.FRAME_CUBE_SIDE_LENGTH / 2;
        anglePoint.elements[2] = -globalConfig.FRAME_CUBE_SIDE_LENGTH / 2;
        anglePoint = this.vpMatrix.multiplyVector3(anglePoint);
        let topBottom = Math.abs(anglePoint.elements[1]);

        // 求囊括立方体的左右边界
        anglePoint.elements[0] = - globalConfig.FRAME_CUBE_SIDE_LENGTH / 2;
        anglePoint.elements[1] = globalConfig.FRAME_CUBE_SIDE_LENGTH / 2;
        anglePoint.elements[2] = globalConfig.FRAME_CUBE_SIDE_LENGTH / 2;
        anglePoint = this.vpMatrix.multiplyVector3(anglePoint);
        let leftRight = Math.abs(anglePoint.elements[0]);

        let border = topBottom * 2 - leftRight;
        // 设置裁切面
        this.vpMatrix.setOrtho(-border, border, -border, border, 0, watchDepth);
        this.vpMatrix.lookAt(globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, 0, 0, 0, 0, 1, 0);

        this.vpR = new CuonMatrix4();
        this.vpR.set(this.vpMatrix);;
        this.vpR.invert();

        // 相机方向
        this.cameraVec = new CuonVector3();
        this.cameraVec.elements[0] = 0;
        this.cameraVec.elements[1] = 0;
        this.cameraVec.elements[2] = 1;
        this.cameraVec = this.machine.colorGetter.vpR.multiplyVector3(this.cameraVec);

        // 初始化小立方体的 mvp 矩阵
        this.dragCubeMvpMatrix = new CuonMatrix4();

        // 绘制线框立方体
        this.componentDidUpdate();
    }

    public override componentDidUpdate() {
        // 清空颜色缓冲区和深度缓冲区
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // 绘制外立方体线框
        this.drawByElementData(this.vpMatrix, this.borderCubeVerticesColors, this.cubeFrameindices, this.gl.LINES);

        this.dragCubeMvpMatrix.set(this.vpMatrix);
        this.dragCubeMvpMatrix.translate(this.state.posX, this.state.posY, this.state.posZ);

        let unitCout = this.xRect.length / 6;
        if (this.state.xEnable || this.state.xDrag) {
            for (let i = 0; i < unitCout; i++) {
                this.xRect[i * 6 + 3] = 1;
                this.xRect[i * 6 + 4] = 1;
                this.xRect[i * 6 + 5] = 1;
            };
            // 绘制内立方体线框
            this.drawByElementData(this.dragCubeMvpMatrix, this.xRect, this.rectIndices, this.gl.LINES);
        };

        if (this.state.yEnable || this.state.yDrag) {
            for (let i = 0; i < unitCout; i++) {
                this.yRect[i * 6 + 3] = 1;
                this.yRect[i * 6 + 4] = 1;
                this.yRect[i * 6 + 5] = 1;
            };
            // 绘制内立方体线框
            this.drawByElementData(this.dragCubeMvpMatrix, this.yRect, this.rectIndices, this.gl.LINES);
        };

        if (this.state.zEnable || this.state.zDrag) {
            for (let i = 0; i < unitCout; i++) {
                this.zRect[i * 6 + 3] = 1;
                this.zRect[i * 6 + 4] = 1;
                this.zRect[i * 6 + 5] = 1;
            };
            // 绘制内立方体线框
            this.drawByElementData(this.dragCubeMvpMatrix, this.zRect, this.rectIndices, this.gl.LINES);
        };

        for (let i = 0; i < unitCout; i++) {
            this.xRect[i * 6 + 3] = 1;
            this.xRect[i * 6 + 4] = 0;
            this.xRect[i * 6 + 5] = 0;
        };
        // 绘制内立方体线框
        this.drawByElementData(this.dragCubeMvpMatrix, this.xRect, this.rectIndices, this.gl.LINES);

        for (let i = 0; i < unitCout; i++) {
            this.yRect[i * 6 + 3] = 0;
            this.yRect[i * 6 + 4] = 1;
            this.yRect[i * 6 + 5] = 0;
        };
        // 绘制内立方体线框
        this.drawByElementData(this.dragCubeMvpMatrix, this.yRect, this.rectIndices, this.gl.LINES);

        for (let i = 0; i < unitCout; i++) {
            this.zRect[i * 6 + 3] = 0;
            this.zRect[i * 6 + 4] = 0;
            this.zRect[i * 6 + 5] = 1;
        };
        // 绘制内立方体线框
        this.drawByElementData(this.dragCubeMvpMatrix, this.zRect, this.rectIndices, this.gl.LINES);

        this.xPlane[0] = globalConfig.FRAME_CUBE_SIDE_LENGTH / 2;
        this.xPlane[1] = this.state.posY;
        this.xPlane[2] = this.state.posZ + globalConfig.DRAG_CUBE_SIDE_LENGTH / 2;

        this.xPlane[6] = globalConfig.FRAME_CUBE_SIDE_LENGTH / 2;
        this.xPlane[7] = this.state.posY;
        this.xPlane[8] = this.state.posZ - globalConfig.DRAG_CUBE_SIDE_LENGTH / 2;

        this.xPlane[12] = - globalConfig.FRAME_CUBE_SIDE_LENGTH / 2;
        this.xPlane[13] = this.state.posY;
        this.xPlane[14] = this.state.posZ - globalConfig.DRAG_CUBE_SIDE_LENGTH / 2;

        this.xPlane[18] = - globalConfig.FRAME_CUBE_SIDE_LENGTH / 2;
        this.xPlane[19] = this.state.posY;
        this.xPlane[20] = this.state.posZ + globalConfig.DRAG_CUBE_SIDE_LENGTH / 2;

        for (let i = 0; i < 4; i++) {
            // 对范围进行约束
            this.xPlane[i * 6 + 0] = Math.max(- globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, Math.min(this.xPlane[i * 6 + 0], globalConfig.FRAME_CUBE_SIDE_LENGTH / 2));
            this.xPlane[i * 6 + 1] = Math.max(- globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, Math.min(this.xPlane[i * 6 + 1], globalConfig.FRAME_CUBE_SIDE_LENGTH / 2));
            this.xPlane[i * 6 + 2] = Math.max(- globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, Math.min(this.xPlane[i * 6 + 2], globalConfig.FRAME_CUBE_SIDE_LENGTH / 2));

            this.xPlane[i * 6 + 3] = this.xPlane[i * 6 + 0] / globalConfig.FRAME_CUBE_SIDE_LENGTH + 0.5;
            this.xPlane[i * 6 + 4] = this.xPlane[i * 6 + 1] / globalConfig.FRAME_CUBE_SIDE_LENGTH + 0.5;
            this.xPlane[i * 6 + 5] = this.xPlane[i * 6 + 2] / globalConfig.FRAME_CUBE_SIDE_LENGTH + 0.5;
        };
        // 绘制内立方体线框
        this.drawByElementData(this.vpMatrix, this.xPlane, this.hitTestIndices, this.gl.TRIANGLES);

        this.zPlane[0] = this.state.posX + globalConfig.DRAG_CUBE_SIDE_LENGTH / 2;
        this.zPlane[1] = this.state.posY;
        this.zPlane[2] = globalConfig.FRAME_CUBE_SIDE_LENGTH / 2;

        this.zPlane[6] = this.state.posX + globalConfig.DRAG_CUBE_SIDE_LENGTH / 2;
        this.zPlane[7] = this.state.posY;
        this.zPlane[8] = - globalConfig.FRAME_CUBE_SIDE_LENGTH / 2;

        this.zPlane[12] = this.state.posX - globalConfig.DRAG_CUBE_SIDE_LENGTH / 2;
        this.zPlane[13] = this.state.posY;
        this.zPlane[14] = - globalConfig.FRAME_CUBE_SIDE_LENGTH / 2;

        this.zPlane[18] = this.state.posX - globalConfig.DRAG_CUBE_SIDE_LENGTH / 2;
        this.zPlane[19] = this.state.posY;
        this.zPlane[20] = globalConfig.FRAME_CUBE_SIDE_LENGTH / 2;

        for (let i = 0; i < 4; i++) {
            // 对范围进行约束
            this.zPlane[i * 6 + 0] = Math.max(- globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, Math.min(this.zPlane[i * 6 + 0], globalConfig.FRAME_CUBE_SIDE_LENGTH / 2));
            this.zPlane[i * 6 + 1] = Math.max(- globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, Math.min(this.zPlane[i * 6 + 1], globalConfig.FRAME_CUBE_SIDE_LENGTH / 2));
            this.zPlane[i * 6 + 2] = Math.max(- globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, Math.min(this.zPlane[i * 6 + 2], globalConfig.FRAME_CUBE_SIDE_LENGTH / 2));

            this.zPlane[i * 6 + 3] = this.zPlane[i * 6 + 0] / globalConfig.FRAME_CUBE_SIDE_LENGTH + 0.5;
            this.zPlane[i * 6 + 4] = this.zPlane[i * 6 + 1] / globalConfig.FRAME_CUBE_SIDE_LENGTH + 0.5;
            this.zPlane[i * 6 + 5] = this.zPlane[i * 6 + 2] / globalConfig.FRAME_CUBE_SIDE_LENGTH + 0.5;
        };
        // 绘制内立方体线框
        this.drawByElementData(this.vpMatrix, this.zPlane, this.hitTestIndices, this.gl.TRIANGLES);
    }

    /**
     * 绘制传入的顶点数据
     * @param verticesColors 
     * @param indices 
     */
    drawByElementData(mvpMatrix: CuonMatrix4, verticesColors: Float32Array, indices: Uint8Array, shapeType: number) {
        // 使用某个应用程序
        this.gl.useProgram(this.program);

        // 将缓冲区对象绑定到目标
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexColorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, verticesColors, this.gl.STATIC_DRAW);

        // 填充 a_Position 需要的数据
        this.gl.vertexAttribPointer(this.a_Position, 3, this.gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 6, 0);
        this.gl.enableVertexAttribArray(this.a_Position);

        // 填充 a_Color 需要的数据
        this.gl.vertexAttribPointer(this.a_Color, 3, this.gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 6, Float32Array.BYTES_PER_ELEMENT * 3);
        this.gl.enableVertexAttribArray(this.a_Color);

        // 设置视点和视线
        this.gl.uniformMatrix4fv(this.u_MvpMatrix, false, mvpMatrix.elements);

        // 传入顶点索引数据
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indices, this.gl.STATIC_DRAW);

        // 绘制图形
        this.gl.drawElements(shapeType, indices.length, this.gl.UNSIGNED_BYTE, 0);
    }

    /**
     * 线框立方体的顶点数据
     */
    borderCubeVerticesColors: Float32Array = new Float32Array([
        // Vertex coordinates and color
        globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v0 White
        -globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v1 Magenta
        -globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, -globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v2 Red
        globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, -globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v3 Yellow
        globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, -globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, -globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v4 Green
        globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, -globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v5 Cyan
        -globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, -globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v6 Blue
        -globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, -globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, -globalConfig.FRAME_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v7 Black
    ]);

    /**
     * 线框立方体的顶点数据
     */
    dragCubeVerticesColors: Float32Array = new Float32Array([
        // Vertex coordinates and color
        globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v0 White
        -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v1 Magenta
        -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v2 Red
        globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v3 Yellow
        globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v4 Green
        globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v5 Cyan
        -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v6 Blue
        -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v7 Black
    ]);

    /**
     * 线框立方体绘制点的排列表
     */
    cubeFrameindices: Uint8Array = new Uint8Array([
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

    /**
     * 碰撞检测—x
     */
    hitTestVerticesColorsX: Float32Array = new Float32Array([
        globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 1.0, 0.0, 0.0,  // v0 White
        globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 1.0, 0.0, 0.0,  // v1 Magenta
        globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 1.0, 0.0, 0.0,  // v2 Red
        globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 1.0, 0.0, 0.0  // v3 Yellow
    ]);

    /**
     * 碰撞检测—y
     */
    hitTestVerticesColorsY: Float32Array = new Float32Array([
        globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 0.0, 1.0, 0.0,  // v0 White
        globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 0.0, 1.0, 0.0,  // v2 Red
        -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 0.0, 1.0, 0.0,  // v3 Yellow
        -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 0.0, 1.0, 0.0,  // v1 Magenta
    ]);

    /**
     * 碰撞检测—z
     */
    hitTestVerticesColorsZ: Float32Array = new Float32Array([
        globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 0.0, 0.0, 1.0,  // v0 White
        -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 0.0, 0.0, 1.0,  // v1 Magenta
        -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 0.0, 0.0, 1.0,  // v2 Red
        globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 0.0, 0.0, 1.0  // v3 Yellow
    ]);

    /**
     * 面的顶点数据表
     */
    hitTestIndices = new Uint8Array([   // Indices of the vertices
        0, 1, 2, 0, 2, 3    // front
    ]);

    /**
     * 框—x
     */
    xRect: Float32Array = new Float32Array([
        globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v0 White
        globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v1 Magenta
        globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v2 Red
        globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0  // v3 Yellow
    ]);

    /**
     * 框—y
     */
    yRect: Float32Array = new Float32Array([
        globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v0 White
        globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v2 Red
        -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v3 Yellow
        -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v1 Magenta
    ]);
    
    /**
     * 框—z
     */
     zRect: Float32Array = new Float32Array([
        globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v0 White
        -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v1 Magenta
        -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0,  // v2 Red
        globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, -globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, globalConfig.DRAG_CUBE_SIDE_LENGTH / 2, 1.0, 1.0, 1.0  // v3 Yellow
    ]);

    /**
     * 框
     */
    rectIndices = new Uint8Array([
        0, 1, 
        1, 2,
        2, 3,
        3, 0
    ]);
    
    /**
     * 片-x
     */
    xPlane: Float32Array = new Float32Array([
        0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0
    ]);
    
    /**
     * 片-y
     */
    yPlane: Float32Array = new Float32Array([
        
    ]);

    
    /**
     * 片-z
     */
    zPlane: Float32Array = new Float32Array([
        0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0
    ]);

    /**
     * 存储读来的颜色值
     */
    pixels = new Uint8Array(4);

    onMouseOver(args: any) {
        this.machine.currState.onMouseHover(args);
    }

    onMouseDown (args: any) {
        this.machine.currState.onMouseDown(args);    
    }

    onMouseUp (args: any) {
        this.machine.currState.onMouseUp(args);
    }

    public override render() {
        return (
            <div onMouseDown={this.onMouseDown.bind(this)} onMouseUp={this.onMouseUp.bind(this)} onMouseMove={this.onMouseOver.bind(this)} style={{ width: `${globalConfig.CANVAS_SIZE + 40}px`, padding: `20px`, margin: `20px`, boxShadow: `2px 2px 5px #000` }}>
                <canvas width={globalConfig.CANVAS_SIZE} height={globalConfig.CANVAS_SIZE}>
                </canvas>
            </div>
        )
    }
}