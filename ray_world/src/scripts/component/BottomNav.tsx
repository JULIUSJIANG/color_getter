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
    public override render(): React.ReactNode {
        return (
            <div
                style={{
                    position: "absolute",
                    right: "20px",
                    bottom: "20px"
                }}
            >
                <div>
                    <Checkbox 
                        checked={root.store.getState().drawBgGrid} 
                        onChange={(evt: CheckboxChangeEvent) => root.reducerSetDrawBgGrid.Eff(evt.target.checked)} 
                        style={{color: `white`}}
                    >
                        绘制背景格子
                    </Checkbox>
                </div>

                <div>
                    <Checkbox 
                        checked={root.store.getState().drawBlock} 
                        onChange={(evt: CheckboxChangeEvent) => root.reducerSetDrawBlock.Eff(evt.target.checked)} 
                        style={{color: `white`}}
                    >
                        绘制立体方块
                    </Checkbox>
                </div>

                <div>
                    <Checkbox 
                        checked={root.store.getState().drawLightPoint} 
                        onChange={(evt: CheckboxChangeEvent) => root.reducerSetDrawLightPoint.Eff(evt.target.checked)} 
                        style={{color: `white`}}
                    >
                        绘制光源亮点
                    </Checkbox>
                </div>

                <div>
                    <Checkbox 
                        checked={root.store.getState().drawLightArea} 
                        onChange={(evt: CheckboxChangeEvent) => root.reducerSetDrawLightArea.Eff(evt.target.checked)} 
                        style={{color: `white`}}
                    >
                        绘制探照区域
                    </Checkbox>
                </div>

                <div>
                    <Checkbox 
                        checked={root.store.getState().drawSeepData} 
                        onChange={(evt: CheckboxChangeEvent) => root.reducerSetDrawSeepData.Eff(evt.target.checked)} 
                        style={{color: `white`}}
                    >
                        绘制渗透数据
                    </Checkbox>
                </div>
            </div>
        )
    }
}

const BottomNav = connect(state => state)(Component);
export default BottomNav;