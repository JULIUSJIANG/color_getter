import CuonVector3 from "./webgl/CuonVector3";

namespace utilMath {
    /**
     * 取得射线 angle 与点 1、2 连线的交点距离
     * @param a1 
     * @param d1 
     * @param a2 
     * @param d2 
     * @param angle 
     * @returns 
     */
    export function GetDistanceAngleToLine (
        a1: number,
        d1: number,
        a2: number,
        d2: number,
        angle: number
    )
    {
        a1 = a1 / 180 * Math.PI;
        a2 = a2 / 180 * Math.PI;
        angle = angle / 180 * Math.PI;
        let p1 = [Math.cos(a1) * d1, Math.sin(a1) * d1];
        let p2 = [Math.cos(a2) * d2, Math.sin(a2) * d2];

        let p12 = new CuonVector3();
        p12.elements[0] = p2[0] - p1[0];
        p12.elements[1] = p2[1] - p1[1];

        let right = p12.GetRight();
        let cosAngle = Math.cos(angle);
        let sinAngle = Math.sin(angle);
        let deno = (cosAngle * right.elements[0] + sinAngle * right.elements[1]);
        if (deno == 0) {
            return 0;
        };
        return (p2[0] * right.elements[0] + p2[1] * right.elements[1]) / deno;
    }

    /**
     * 获取点 1、2 的距离
     * @param a1 
     * @param d1 
     * @param a2 
     * @param d2 
     */
    export function GetDistancePointToPoint (
        a1: number,
        d1: number,
        a2: number,
        d2: number
    )
    {
        let pos1 = [Math.cos(a1 / 180 * Math.PI) * d1, Math.sin(a1 / 180 * Math.PI) * d1];
        let pos2 = [Math.cos(a2 / 180 * Math.PI) * d2, Math.sin(a2 / 180 * Math.PI) * d2];
        return Math.sqrt((pos1[0] - pos2[0]) ** 2 + (pos2[0] - pos2[0]) ** 2);
    }
};

export default utilMath;