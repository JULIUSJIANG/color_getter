namespace utilNode {
    /**
     * 获取一个矢量对应的 cc 角度
     */
    export function ParseVec2ToCCAngle (vec2: cc.Vec2) {
        let angle = Math.atan2(vec2.y, vec2.x);
        return angle / Math.PI * 180 - 90;
    }

    /**
     * 获取一个 cc 角度对应的矢量
     * @param out 
     * @param angle 
     */
    export function ParseAngleToVec2 (out: cc.Vec2, angle: number) {
        angle = (angle + 90) / 180 * Math.PI;
        out.x = Math.cos(angle);
        out.y = Math.sin(angle);
    }
}

export default utilNode;