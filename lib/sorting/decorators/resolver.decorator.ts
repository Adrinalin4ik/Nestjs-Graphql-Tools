import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";
import { Args } from "@nestjs/graphql";
import { BaseEntity } from "../../common";
import { standardize } from "../../utils/functions";
import { SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY } from "../constants";
import { getSortingFullInputType } from "../input-type-generator";
import { convertSortingParameters } from "../query.builder";
import { GraphqlSortingFieldMetadata, GraphqlSortingTypeDecoratorMetadata } from "./field.decorator";

export interface ISortingDecoratorParams {
  name?: string;
  sqlAlias?: string;
  raw?: boolean;
}


// @GraphqlSorting decorator
// @deprecated
export const GraphqlSorting = () => {
  return (target, property, descriptor) => {
    // const actualDescriptor = descriptor.value;
    // descriptor.value = function(...args) {
    //   applySortingParameter(args, target, property);
    //   return actualDescriptor.call(this, ...args);
    // };
    // Reflect.defineMetadata(GRAPHQL_SORTING_DECORATOR_METADATA_KEY, '', target, property); // for graphql loader
  };
};


// @Sorting decorator
export const Sorting = (baseEntity: () => BaseEntity | BaseEntity[], options?: ISortingDecoratorParams) => {
  return (target, propertyName, paramIndex) => {
    const name = `${standardize(target.constructor.name)}_${standardize(propertyName)}`;
    // convert params to array
    const extractedResults = baseEntity();
    let typeFunctions = extractedResults as BaseEntity[];
    if (!Array.isArray(extractedResults)) {
      typeFunctions = [extractedResults];
    }
    const sortingFullType = getSortingFullInputType(typeFunctions, name);
    

    // Combine fields from all models together
    const customFields = typeFunctions.reduce((acc, typeFn) => {
      const customSortingData: GraphqlSortingTypeDecoratorMetadata = Reflect.getMetadata(SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, typeFn.prototype)
      if (customSortingData) {
        for (const field of customSortingData.fields.values()) {
          acc.set(field.name, field)
        }
      }
      return acc;
    }, new Map<string, GraphqlSortingFieldMetadata>());

    Reflect.defineMetadata(SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, customFields, target, propertyName);
    
    const pipes: PipeTransform[] = [];

    if (!options?.raw) {
      pipes.push(
        new SortingPipe({
          options,
          customFields
        })
      )
    }

    Args(
      {
        name: options?.name || 'order_by',
        nullable: true,
        type: () => [sortingFullType],
      }, 
      ...pipes
    )(target, propertyName, paramIndex);
  }
}

export interface ISortingPipeArgs {
  options: ISortingDecoratorParams,
  customFields: Map<string, GraphqlSortingFieldMetadata>
}

@Injectable()
export class SortingPipe implements PipeTransform {
  constructor(public readonly args: ISortingPipeArgs) {}
  transform(value: any, _metadata: ArgumentMetadata) {
    return convertSortingParameters(value, this.args.customFields, this.args.options);
  }
}