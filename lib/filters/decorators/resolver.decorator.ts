import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";
import { Args } from "@nestjs/graphql";
import { Brackets } from "typeorm";
import { BaseEntity } from "../../common";
import { standardize } from "../../utils/functions";
import { FILTER_DECORATOR_CUSTOM_FIELDS_METADATA_KEY } from "../constants";
import { getFilterFullInputType } from "../input-type-generator";
import { EOperationType, convertFilterParameters } from "../query.builder";
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
    // Generate input type for filter
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

    // Store custom fields metadata
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

    // Add filter input type to resolver
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
    let params = value;
    if (!Array.isArray(value)) {
      params = [value]
    }
    // Convert filter parameters from json to typeorm query where statement
    return convertFilterParameters(params, EOperationType.AND, this.args.customFields, this.args.options);
  }
}