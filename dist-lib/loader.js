"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapOneToManyRelation = exports.GraphqlLoader = exports.Loader = void 0;
const common_1 = require("@nestjs/common");
const dataloader_1 = require("dataloader");
const lodash_1 = require("lodash");
const filter_1 = require("./filter");
const sorting_1 = require("./sorting");
exports.Loader = (0, common_1.createParamDecorator)((_data, ctx) => {
    const args = ctx.getArgs();
    const { req } = args[2];
    return {
        _name_: 'LoaderPropertyDecorator',
        parent: args[0],
        ctx,
        req,
        helpers: {
            mapOneToManyRelation: exports.mapOneToManyRelation,
            mapManyToOneRelation,
        },
    };
});
const GraphqlLoader = (options = {
    foreignKey: 'id',
}) => {
    return (target, property, descriptor) => {
        const loaderKey = `${target.constructor.name}.${property}`;
        const actualDescriptor = descriptor.value;
        descriptor.value = function (...args) {
            (0, filter_1.applyFilterParameter)(args);
            (0, sorting_1.applySortingParameter)(args);
            const loader = args.find(x => (x === null || x === void 0 ? void 0 : x._name_) === 'LoaderPropertyDecorator');
            if (!loader || !loader.parent) {
                throw new Error('@Loader parameter decorator is not first parameter or missing');
            }
            if (!loader.req._loader) {
                loader.req._loader = {};
            }
            if (!loader.req._loader[loaderKey]) {
                loader.req._loader[loaderKey] = new dataloader_1.default(async (ids) => {
                    loader.ids = ids;
                    return actualDescriptor.call(this, ...args);
                });
            }
            if (loader.parent[options.foreignKey]) {
                return loader.req._loader[loaderKey].load(loader.parent[options.foreignKey]);
            }
        };
    };
};
exports.GraphqlLoader = GraphqlLoader;
const mapOneToManyRelation = (entities, ids, foreignKey) => {
    const gs = (0, lodash_1.groupBy)(entities, foreignKey);
    const res = ids.map(k => gs[k] || []);
    return res;
};
exports.mapOneToManyRelation = mapOneToManyRelation;
function mapManyToOneRelation(entities, ids) {
    const mappedEntities = entities.reduce((acc, e) => {
        acc[e.id] = e;
        return acc;
    }, {});
    return ids.map(k => mappedEntities[k]);
}
//# sourceMappingURL=loader.js.map