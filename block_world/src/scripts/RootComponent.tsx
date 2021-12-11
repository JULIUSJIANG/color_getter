import React from "react";
import rootConfig from "./RootConfig";
import RootState from "./RootState";
import TopNav from "./component/TopNav";
import WebglMain from "./component/WebglMain";

/**
 * 全局环境的组件
 */
export default class RootComponet extends React.Component<{}, RootState> {
    /**
     * 全局实例
     */
    public static inst: RootComponet;

    public constructor (props: {}) {
        super(props);
        // 记录全局实例
        RootComponet.inst = this;
        // 读取本地存储的数据
        let storagedData = localStorage.getItem(rootConfig.storageKey);
        // 如果没有存储过，那么创建为默认值
        if (storagedData == null || storagedData == ``) {
            this.state = RootState.def;
        }
        // 否则采用存储值
        else {
            this.state = JSON.parse(storagedData);
        };
        // 每次页面销毁的时候，确保状态保存好
        window.onunload = () => {
            localStorage.setItem(rootConfig.storageKey, JSON.stringify(this.state));
        };
    }

    public override render () {
        return (
            <div style={{width: "100%", height: "100%"}}>
                <WebglMain/>
                <TopNav/>
            </div>
        )
    }
}