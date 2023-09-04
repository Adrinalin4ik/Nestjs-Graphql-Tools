"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapOneToManyPolymorphicRelation = exports.mapOneToManyRelation = exports.GraphqlLoader = exports.Loader = exports.LOADER_DECORATOR_NAME_METADATA_KEY = void 0;
const common_1 = require("@nestjs/common");
const lodash_1 = require("lodash");
const DataLoader = require('dataloader');
exports.LOADER_DECORATOR_NAME_METADATA_KEY = 'LoaderPropertyDecorator';
exports.Loader = (0, common_1.createParamDecorator)((_data, ctx) => {
    const args = ctx.getArgs();
    const { req } = args[2];
    const info = args[3];
    return {
        _name_: exports.LOADER_DECORATOR_NAME_METADATA_KEY,
        parent: args[0],
        ctx,
        info,
        req,
        helpers: {
            mapOneToManyRelation: exports.mapOneToManyRelation,
            mapOneToManyPolymorphicRelation: exports.mapOneToManyPolymorphicRelation,
            mapManyToOneRelation,
        },
    };
});
const GraphqlLoader = (args) => {
    const options = Object.assign({ foreignKey: 'id' }, args);
    return (target, property, descriptor) => {
        const actualDescriptor = descriptor.value;
        descriptor.value = function (...args) {
            const loader = args.find(x => (x === null || x === void 0 ? void 0 : x._name_) === exports.LOADER_DECORATOR_NAME_METADATA_KEY);
            const loaderKey = `${concatPath(loader.info.path)}.${target.constructor.name}.${property}`;
            if (!loader || !loader.parent) {
                throw new Error('@Loader parameter decorator is not first parameter or missing');
            }
            if (!loader.req) {
                loader.req = {};
            }
            if (!loader.req._loader) {
                loader.req._loader = {};
            }
            if (!loader.req._loader[loaderKey]) {
                loader.req._loader[loaderKey] = new DataLoader(async (ids) => {
                    if (options.polymorphic) {
                        const polyLoader = loader;
                        const gs = (0, lodash_1.groupBy)(ids, 'descriminator');
                        polyLoader.polimorphicTypes = Object.entries(gs).reduce((acc, [descriminator, entities]) => {
                            acc.push({
                                descriminator,
                                ids: entities.map(x => x.id)
                            });
                            return acc;
                        }, []);
                        polyLoader.ids = ids;
                    }
                    else {
                        loader.ids = ids;
                    }
                    const result = await actualDescriptor.call(this, ...args);
                    loader.req._loader = [];
                    return result;
                });
            }
            if (options.polymorphic) {
                if (typeof options.polymorphic === 'function') {
                    return loader.req._loader[loaderKey].load(options.polymorphic(loader.parent));
                }
                else if (loader.parent[options.polymorphic.id] && loader.parent[options.polymorphic.descriminator]) {
                    return loader.req._loader[loaderKey].load({
                        id: loader.parent[options.polymorphic.id],
                        descriminator: loader.parent[options.polymorphic.descriminator]
                    });
                }
                else {
                    throw new Error(`[${target.constructor.name}.${property}] Polymorphic relation Error: Your parent model must provide id and type for the nested model`);
                }
            }
            else {
                if (typeof options.foreignKey === 'function') {
                    return loader.req._loader[loaderKey].load(options.foreignKey(loader.parent));
                }
                else if (loader.parent.hasOwnProperty(options.foreignKey)) {
                    if (loader.parent[options.foreignKey]) {
                        return loader.req._loader[loaderKey].load(loader.parent[options.foreignKey]);
                    }
                }
                else {
                    throw new Error(`[${target.constructor.name}.${property}] Can't find field "${options.foreignKey}" in the parent object. You should request "${options.foreignKey}" in the parent of "${property}" in the graphql query.`);
                }
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
function mapManyToOneRelation(entities, ids, foreignKey = 'id') {
    const mappedEntities = entities.reduce((acc, e) => {
        acc[e[foreignKey]] = e;
        return acc;
    }, {});
    return ids.map(k => mappedEntities[k]);
}
const mapOneToManyPolymorphicRelation = (entities, typeIds, foreignKey = 'id') => {
    const gs = entities.reduce((acc, union) => {
        union.entities.forEach(entity => {
            const key = `${union.descriminator}_${entity[foreignKey]}`;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(Object.assign(Object.assign({}, entity), { '__UnionDescriminator__': union.descriminator }));
        });
        return acc;
    }, {});
    const res = typeIds.map(type => gs[`${type.descriminator}_${type.id}`] || null);
    return res;
};
exports.mapOneToManyPolymorphicRelation = mapOneToManyPolymorphicRelation;
const concatPath = (path, acc) => {
    if (path.typename !== 'Query' && path.typename !== 'Subscription' && path.typename !== 'Mutation') {
        if (typeof path.key === 'number') {
            return concatPath(path.prev, acc);
        }
        else {
            return concatPath(path.prev, path.key + (acc ? '.' + acc : ''));
        }
    }
    else {
        return acc;
    }
};
//# sourceMappingURL=loader.js.map