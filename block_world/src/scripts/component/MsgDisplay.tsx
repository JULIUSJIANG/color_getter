import React from "react";
import perfAnalyse from "../../lib/perf_analyse/PerfAnalyse";
import root from "../Root";
import {connect} from 'react-redux';

/**
 * 信息栏
 */
class Component extends React.Component {
        
    /**
     * 文本标签
     */
    public text: HTMLSpanElement;

     /**
      * 帧的监听 id
      */
    private _frameListendId: number;
 
    /**
     * 当前时间戳
     */
    private _currTimer: number;

    public override componentDidMount(): void {
        this._currTimer = Date.now();
        this._frameListendId = root.evterFrame.On(() => {
            let currTimer = Date.now();
            let passedMS = currTimer - this._currTimer;
            this._currTimer = currTimer;
            this.text.innerText = `fps:${Math.ceil(1000 / passedMS)}\n\n${perfAnalyse.SumMsg()}`;
        });
    }

    public override componentWillUnmount(): void {
        root.evterFrame.Off(this._frameListendId);
    }

    public override render () {
        return (
            <span
                ref={(ref) => {
                    this.text = ref;
                }}
                style={{
                    position: "absolute",
                    left: "20px",
                    bottom: "20px",
                    fontSize: "14px",
                    color: "#ffffff"
                }}
            >
            </span>
        );
    }
}

const MsgDisplay = connect(state => state)(Component);
export default MsgDisplay;