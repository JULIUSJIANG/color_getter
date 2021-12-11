/**
 * 颜色-片元着色器
 */
namespace colorFragment {
    export const shader = 
`
#ifdef GL_ES
precision mediump float;
#endif
varying vec4 v_Color;
void main () {
    gl_FragColor = v_Color;
}
`
};

export default colorFragment;