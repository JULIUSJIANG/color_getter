import React from "react";
import { Radio, RadioChangeEvent} from 'antd';
import { connect } from "react-redux";
import Checkbox from "antd/lib/checkbox/Checkbox";
import {CheckboxChangeEvent} from "antd/lib/checkbox/Checkbox";
import root from "../Root";

/**
 * 底部栏
 */
class Component extends React.Component {
    
    OnCheckBoxAreaChanged (evt: CheckboxChangeEvent) {
        root.reducerSetDrawArea.Eff(evt.target.checked);
    }

    OnCheckBoxSeepChanged (evt: CheckboxChangeEvent) {
        root.reducerSetDrawSeep.Eff(evt.target.checked);
    }

    public override render(): React.ReactNode {
        return (
            <div
                style={{
                    position: "absolute",
                    right: "20px",
                    bottom: "20px"
                }}
            >
                <Checkbox checked={root.store.getState().drawArea} onChange={this.OnCheckBoxAreaChanged.bind(this)} style={{color: `white`}}>绘制探照区域</Checkbox>
                <Checkbox checked={root.store.getState().drawSeep} onChange={this.OnCheckBoxSeepChanged.bind(this)} style={{color: `white`}}>绘制渗透数据</Checkbox>
            </div>
        )
    }
}

const BottomNav = connect(state => state)(Component);
export default BottomNav;