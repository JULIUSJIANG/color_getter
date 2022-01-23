/**
 * 角度范围
 */
export default class LightSeepAngleArea {
    /**
     * 起始位置，小于等于 to
     */
    from: number;
    /**
     * 结束位置，大于等于 from
     */
    to: number;

    public constructor (
        from: number,
        to: number
    )
    {
        this.from = from;
        this.to = to;
    }
}