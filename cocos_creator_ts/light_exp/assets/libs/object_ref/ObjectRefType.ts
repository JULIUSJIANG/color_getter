import ObjectPoolRec from "../object_pool/ObjectPoolRec";
import OperationCtrl from "../OperationCtrl";
import ObjectRefInst from "./ObjectRefInst";

/**
 * 全对象池-类型
 */
export default class ObjectRefType<IndexType, InstType extends ObjectRefInst<IndexType>> extends OperationCtrl<InstType> {
    /**
     * 归属的总数据中心
     */
    public relIndex: IndexType;

    public constructor (
        relIndex: IndexType,
        poolRec: ObjectPoolRec<InstType>
    )
    {
        super(poolRec);
        this.relIndex = relIndex;
    }

    /**
     * 构造实例
     * @returns 
     */
    public Create (
        ...args
    ) 
    {
        let id = super.Create();
        this.Op(
            id,
            (inst) => {
                inst.relIndex = this.relIndex;
                inst.id = id;
                if (0 < args.length) {
                    args[0](inst);
                };
                inst.OnInit();
            }
        );
        return id;
    }

    /**
     * 销毁实例
     * @param id 
     */
    public override Destory (id: number) {
        this.Op(
            id,
            (inst) => {
                inst.OnDestory();
                inst.relIndex = null;
                inst.id = null;
            }
        );
        super.Destory(id);
    }
}