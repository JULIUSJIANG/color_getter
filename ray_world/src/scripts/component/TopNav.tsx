import React from "react";
import { Radio, RadioChangeEvent } from 'antd';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import root from "../Root";

/**
 * 顶部栏
 */
class Component extends React.Component {
    OnOpChanged (evt: RadioChangeEvent) {
        root.reducerSetOp.Eff(evt.target.value);
    }

    public override render () {
        return (
            <Radio.Group
                options={[
                    {
                        label: `拖拽场景`,
                        value: 0
                    },
                    {
                        label: `放置方块`,
                        value: 1
                    },
                    {
                        label: `销毁方块`,
                        value: 2
                    },
                    {
                        label: `放置光源`,
                        value: 3
                    },
                    {
                        label: `销毁光源`,
                        value: 4
                    }
                ]}
                onChange={this.OnOpChanged.bind(this)}
                value={root.store.getState().opIndex}
                optionType="button"
                buttonStyle="solid"
                style={{
                    position: "absolute",
                    left: "20px",
                    top: "20px"
                }}
            />
        )
    }
}

const TopNav = connect(state => state)(Component);
export default TopNav;