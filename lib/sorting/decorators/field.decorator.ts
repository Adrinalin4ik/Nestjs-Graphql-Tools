import { SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY } from "../constants";

export interface SortingFieldOptions {
  /** Left side of conditional sql expression. 
   * Examples: 
   * 1. Select * from task t where t.title ilike '%test%'. Statement t.title is the left side of a statement 
   * 2. Select * from user u where concat(u.fname, ' ', u.lname) ilike %alex%. Statement concat(u.fname, ' ', u.lname) is the left side of the conditional statement*/
  sqlExp?: string;
}

export interface SortingFieldExcludeOptions {
  exclude: boolean;
}

export interface GraphqlSortingTypeDecoratorMetadata {
  fields: Map<string, GraphqlSortingFieldMetadata>;
}

export interface GraphqlSortingFieldMetadata extends SortingFieldOptions {
  name: string;
}

export class GraphqlSortingTypeDecoratorMetadata {
  fields: Map<string, GraphqlSortingFieldMetadata> = new Map()
  excludedFilterFields = new Set<string>();

  constructor(private target) {
    const meta: GraphqlSortingTypeDecoratorMetadata = Reflect.getMetadata(SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, target);

    if (meta) {
      this.fields = meta.fields;
      this.excludedFilterFields = meta.excludedFilterFields;
    }
  }
  
  save() {
    Reflect.defineMetadata(SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, this, this.target)
  }
}


export const SortingField = (options: SortingFieldOptions | SortingFieldExcludeOptions = {}) => {
  return (target, property) => {
    const metadataObject = new GraphqlSortingTypeDecoratorMetadata(target);

    if (options.hasOwnProperty('exclude')) {
      options = options as SortingFieldExcludeOptions;
      metadataObject.excludedFilterFields.add(property);
    } else {
      options = options as SortingFieldOptions;
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
    }
    
    metadataObject.save();
  }
}