import { ReturnTypeFunc } from "@nestjs/graphql";
import { FILTER_DECORATOR_CUSTOM_FIELDS_METADATA_KEY } from "../constants";

export interface FilterFieldOptions {
  /** Left side of conditional sql expression. 
   * Examples: 
   * 1. Select * from task t where t.title ilike '%test%'. Statement t.title is the left side of a statement 
   * 2. Select * from user u where concat(u.fname, ' ', u.lname) ilike %alex%. Statement concat(u.fname, ' ', u.lname) is the left side of the conditional statement*/
  sqlExp?: string;
}

export interface GraphqlFilterTypeDecoratorMetadata {
  fields: Map<string, GraphqlFilterFieldMetadata>;
}

export interface GraphqlFilterFieldMetadata extends FilterFieldOptions {
  name: string;
  typeFn: ReturnTypeFunc;
}

export const FilterField = (typeFn: ReturnTypeFunc, options: FilterFieldOptions = {}) => {
  return (target, property) => {
    const meta: GraphqlFilterTypeDecoratorMetadata = Reflect.getMetadata(FILTER_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, target);

    let metadataObject = meta;

    if (!meta) {
      metadataObject = {
        fields: new Map()
      }
    }

    if (options && !options.sqlExp) {
      options.sqlExp = property;
    }

    if (metadataObject.fields.has(property)) {
      const field = metadataObject.fields.get(property);
      metadataObject.fields.set(property, {
        ...field,
        ...options
      })
    } else {
      metadataObject.fields.set(property, {
        name: property,
        typeFn,
        ...options
      })
    }
    
    Reflect.defineMetadata(FILTER_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, metadataObject, target)
  }
}