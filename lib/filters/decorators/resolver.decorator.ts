import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";
import { Args } from "@nestjs/graphql";
import { Brackets } from "typeorm";
import { BaseEntity } from "../../common";
import { standardize } from "../../utils/functions";
import { FILTER_DECORATOR_CUSTOM_FIELDS_METADATA_KEY } from "../constants";
import { getFilterFullInputType } from "../input-type-generator";
import { convertFilterParameters } from "../query.builder";
import { GraphqlFilterFieldMetadata, GraphqlFilterTypeDecoratorMetadata } from "./field.decorator";

export interface IFilterDecoratorParams {
  sqlAlias?: string;
  name?: string;
  raw?: boolean;
}


// @GraphqlFilter decorator
// @deprecated
export const GraphqlFilter = () => {
  return (target, property, descriptor) => {
    // const actualDescriptor = descriptor.value;
    // descriptor.value = function(...args) {
    //   applyFilterParameter(args, target, property);
    //   return actualDescriptor.call(this, ...args);
    // };
    // Reflect.defineMetadata(GRAPHQL_FILTER_DECORATOR_METADATA_KEY, '', target, property); // for graphql loader
  };
};


// @Filter decorator
// @deprecated
export const Filter = (baseEntity: () => BaseEntity | BaseEntity[], options?: IFilterDecoratorParams) => {
  return (target, propertyName, paramIndex) => {
    const name = `${standardize(target.constructor.name)}_${standardize(propertyName)}`;
    // convert params to array
    const extractedResults = baseEntity();
    let typeFunctions = extractedResults as BaseEntity[];
    if (!Array.isArray(extractedResults)) {
      typeFunctions = [extractedResults];
    }
    const filterFullType = getFilterFullInputType(typeFunctions, name);
    

    // Combine fields from all models together
    const customFields = typeFunctions.reduce((acc, typeFn) => {
      const customFilterData: GraphqlFilterTypeDecoratorMetadata = Reflect.getMetadata(FILTER_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, typeFn.prototype)
      if (customFilterData) {
        for (const field of customFilterData.fields.values()) {
          acc.set(field.name, field)
        }
      }
      return acc;
    }, new Map<string, GraphqlFilterFieldMetadata>());

    Reflect.defineMetadata(FILTER_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, customFields, target, propertyName);

    const pipes: PipeTransform[] = [];

    if (!options?.raw) {
      pipes.push(
        new FilterPipe({
          options,
          customFields
        })
      )
    }

    Args(
      {
        name: options?.name || 'where',
        nullable: true,
        type: () => filterFullType,
      }, 
      ...pipes
    )(target, propertyName, paramIndex);
  }
}

export interface IFilterPipeArgs {
  options: IFilterDecoratorParams,
  customFields: Map<string, GraphqlFilterFieldMetadata>
}

export interface FilterArgs extends Brackets {}

@Injectable()
export class FilterPipe implements PipeTransform {
  constructor(public readonly args: IFilterPipeArgs) {}
  transform(value: any, _metadata: ArgumentMetadata) {
    return convertFilterParameters(value, this.args.customFields, this.args.options);
  }
}