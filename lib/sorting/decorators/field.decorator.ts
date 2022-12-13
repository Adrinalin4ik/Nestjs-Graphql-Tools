import { SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY } from "../constants";

export interface SortingFieldOptions {
  /** Left side of conditional sql expression. 
   * Examples: 
   * 1. Select * from task t where t.title ilike '%test%'. Statement t.title is the left side of a statement 
   * 2. Select * from user u where concat(u.fname, ' ', u.lname) ilike %alex%. Statement concat(u.fname, ' ', u.lname) is the left side of the conditional statement*/
  sqlExp?: string;
}

export interface GraphqlSortingTypeDecoratorMetadata {
  fields: Map<string, GraphqlSortingFieldMetadata>;
}

export interface GraphqlSortingFieldMetadata extends SortingFieldOptions {
  name: string;
}

export const SortingField = (options: SortingFieldOptions = {}) => {
  return (target, property) => {
    const meta: GraphqlSortingTypeDecoratorMetadata = Reflect.getMetadata(SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, target);

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
        ...options
      })
    }
    
    Reflect.defineMetadata(SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, metadataObject, target)
  }
}