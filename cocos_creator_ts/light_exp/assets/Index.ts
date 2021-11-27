// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html
import BlockIndex from "./libs/block/core/BlockIndex";
import BlockRectangle from "./libs/block/core/BlockRectangle";
import BlockVis from "./libs/block/visualization/BlockVisualization";
import ObjectPool from "./libs/object_pool/ObjectPool";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Index extends cc.Component {

    public override onLoad () {
        let blockVis = new BlockVis();
        let blockIndex = new BlockIndex(blockVis);
        blockIndex.refRectangle.Create(
            50,
            50,
            200,
            100
        );
    }
}