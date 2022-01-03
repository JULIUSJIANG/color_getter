namespace utilCollection {
    /**
     * 用于去重的集合
     */
    const set = new Set();
    /**
     * 去重
     * @param list 
     * @returns 
     */
    export function RemRepeatForList<T> (list: Array<T>) {
        set.clear();
        return list.filter(( ele ) => {
            if (set.has(ele)) {
                return false;
            };
            set.add(ele);
            return true;
        });
    }
}

export default utilCollection;