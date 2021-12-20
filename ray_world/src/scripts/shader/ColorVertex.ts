/**
 * 颜色-顶点着色器
 */
namespace colorVertex {
    export const attNamePos = `a_Position`;
    export const attNameColor = `a_Color`;
    export const attNameMvpMat = `u_MvpMatrix`;
    export const shader =
`
attribute vec4 ${attNamePos};
attribute vec4 ${attNameColor};
uniform mat4 ${attNameMvpMat};
varying vec4 v_Color;
void main () {
    gl_Position = ${attNameMvpMat} * ${attNamePos};
    v_Color = ${attNameColor};
}
`
};

export default colorVertex;