namespace rootAction {
    export const TYPE_RELOAD_WEBGL = typeof `reLoadWebgl`;
    export const reLoadWebgl = () => {
        return {
            type: TYPE_RELOAD_WEBGL
        };
    };
};

export default rootAction;