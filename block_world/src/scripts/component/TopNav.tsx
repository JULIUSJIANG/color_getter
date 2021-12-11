import React from "react";
import { Radio, RadioChangeEvent } from 'antd';
import RootComponet from "../RootComponent";

/**
 * 顶部栏
 */
export default class TopNav extends React.Component {
    OnOpChanged (evt: RadioChangeEvent) {
        RootComponet.inst.setState({
            ...RootComponet.inst.state,
            opIndex: evt.target.value
        });
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
                    }
                ]}
                onChange={this.OnOpChanged.bind(this)}
                value={RootComponet.inst.state.opIndex}
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