export const InheritedModel = () => {
  return (target) => {
    Object.defineProperty(target, '__extension__', {
      value: target.name
    });
    return target;
  }
}