import { ReturnTypeFunc } from "@nestjs/graphql";

export const CUSTOM_FILTER_INPUT_TYPE_DECORATOR_NAME = 'GraphqlFilterInputTypeDecorator';
export const CUSTOM_FILTER_INPUT_TYPE_PROPERTY_DECORATOR_NAME = 'GraphqlFilterFieldTypeDecorator';

export const FilterInputType = () => {
  return (target) => {
    const meta: FilterInputTypeDecoratorMetadata = Reflect.getMetadata(CUSTOM_FILTER_INPUT_TYPE_DECORATOR_NAME, target.prototype);
    const fields = new Map();
    for (const field of meta.fields) {
      fields.set(field.name, field);
    }
    target.prototype.filterInputType = true;
    target.prototype.getFields = () => {
      return meta.fields || [];
    }
    target.prototype.getFieldByName = (name: string) => {
      return fields.get(name);
    }
  }
}

export interface FilterFieldOptions {
  sqlExp?: string;
}

export interface FilterInputTypeDecoratorMetadata {
  fields: FilterInputTypeFieldMetadata[]
}

export interface FilterInputTypeFieldMetadata {
  name: string;
  typeFn: ReturnTypeFunc;
  options: FilterFieldOptions;
}

export const FilterField = (typeFn: ReturnTypeFunc, options: FilterFieldOptions = {}) => {
  return (target, property) => {
    const meta: FilterInputTypeDecoratorMetadata = Reflect.getMetadata(CUSTOM_FILTER_INPUT_TYPE_DECORATOR_NAME, target);

    let fields = meta?.fields;

    if (!meta) {
      fields = []
    }

    if (options && !options.sqlExp) {
      options.sqlExp = property;
    }

    Reflect.defineMetadata(CUSTOM_FILTER_INPUT_TYPE_DECORATOR_NAME, {
      fields: [
        ...fields,
        {
          name: property,
          typeFn,
          options
        }
      ]
    }, target)
  }
}