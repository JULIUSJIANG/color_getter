import React from "react";
import TopNav from "./component/TopNav";
import WebglMain from "./component/WebglMain";
import root from "./Root";
import {connect} from 'react-redux';
import { Provider } from 'react-redux';

/**
 * 全局环境的组件
 */
class Component extends React.Component {
    public componentDidUpdate () {
        // 已经卸载了 webgl 的话，重新开起来
        if (root.store.getState().disableWebgl) {
            root.reducerEnableWebgl.Eff();
        };
    }

    public override render () {
        return (
            <div style={{width: "100%", height: "100%"}}>
                {root.store.getState().disableWebgl ? null : <WebglMain/>}
                <TopNav/>
            </div>
        );
    }
}
// 画面尺寸改变的话，卸载 webgl
window.onresize = () => {
    root.reducerDisableWebgl.Eff();
};
const Main = connect(state => state)(Component);
export default Main;