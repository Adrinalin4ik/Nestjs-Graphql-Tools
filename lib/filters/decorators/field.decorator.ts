import { ReturnTypeFunc } from "@nestjs/graphql";
import { FILTER_DECORATOR_CUSTOM_FIELDS_METADATA_KEY } from "../constants";

export interface FilterFieldOptions {
  /** Left side of conditional sql expression. 
   * Examples: 
   * 1. Select * from task t where t.title ilike '%test%'. Statement t.title is the left side of a statement 
   * 2. Select * from user u where concat(u.fname, ' ', u.lname) ilike %alex%. Statement concat(u.fname, ' ', u.lname) is the left side of the conditional statement*/
  sqlExp?: string;
}

export interface FilterFieldExcludeOptions {
  exclude: boolean;
}

export class GraphqlFilterTypeDecoratorMetadata {
  fields: Map<string, GraphqlFilterFieldMetadata> = new Map()
  excludedFilterFields = new Set<string>();

  constructor(private target) {
    const meta: GraphqlFilterTypeDecoratorMetadata = Reflect.getMetadata(FILTER_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, target);

    if (meta) {
      this.fields = meta.fields;
    }
  }
  
  save() {
    Reflect.defineMetadata(FILTER_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, this, this.target)
  }
}

export interface GraphqlFilterFieldMetadata extends FilterFieldOptions {
  name: string;
  typeFn: ReturnTypeFunc;
}

export function FilterField(options: FilterFieldExcludeOptions);
export function FilterField(typeFn: ReturnTypeFunc, options?: FilterFieldOptions);


export function FilterField(typeFn: ReturnTypeFunc | FilterFieldExcludeOptions, options: FilterFieldOptions = {}) {
  return (target, property) => {
    const metadataObject = new GraphqlFilterTypeDecoratorMetadata(target);

    if (typeof typeFn !== 'function') {
      metadataObject.excludedFilterFields.add(property);
    } else {
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
    }
    metadataObject.save();
  }
}