# 🚀 Changelog
---
## Version 0.4.0
- Added custom filters. `@Filter` decorator now has argument customFilters

```typescript
customFilters: {
  disableDefaultFilters: false // <- Optional parameter. Allows to remove filter which were automatically created based on model. Default value is false. Custom and non custom filters extending togather.
  fields: [ 
    /* 
    Array of defined fields. 
    Name is name of the field which will be used in API.
    TypeFn is the Graphql type function.
    SqlExp is the left side in conditional statement. For example full name filter will build query `where concat(u.fname, ' ', u.lname) <operator> :args`
    */
    {name: 'full_name', typeFn: () => Int, sqlExp: 'concat(u.fname, \' \', u.lname)'},
  ]
}
```
- Removed useless calls of `@GraphqlFilter` and `@GraphqlSorting` decorators from `@GraphqlLoader` decorator
- `@GraphqlSorting` now doesn't have arguments. All arguments has been moved to Sorting decorator.
- Update