### `module-thunk`

[![Stable Release](https://img.shields.io/npm/v/module-thunk.svg)](https://npm.im/module-thunk)
[![Blazing Fast](https://badgen.now.sh/badge/speed/blazing%20%F0%9F%94%A5/green)](https://npm.im/module-thunk)
[![gzip size](http://img.badgesize.io/https://unpkg.com/module-thunk@latest/dist/module-thunk.umd.production.min.js?compression=gzip)](https://unpkg.com/module-thunk@latest/dist/module-thunk.umd.production.min.js)
[![license](https://badgen.now.sh/badge/license/MIT)](./LICENSE)

---

This is a utility package for accepting and parsing strongly typed properties that can be resolved asynchronously. The most useful case is that arguments can be passed as dynamic imports of modules that export the target value.

Various types such as the `ModuleThunk<T>` and `ModuleValue<T>` generics are provided by the package for type definitions. A `ModuleThunk<T>` can be a `ModuleValue<T>` or a `ModuleValueThunk<T, A> = (...args: A) => ModuleValue<T>`. The arguments passed to a module value thunk are specified as the `args` option when calling `resolveModuleThunk` (which can also be defined as a module thunk if passed as the `argsThunk` option, if that's useful in some special case).

A `ModuleValue<T>` can be a `Module<T>` or `Promise<Module<T>>`. A `Module<T>` can be `T`, a `DefaultExportModule<T>` (a module with the target value as the default export), or a `SingleExportModule<T>` (a module that exports a single value or a value that matches `isTargetValue`).

The target value of a module thunk can be of any type, but if the targeted value type is or could be a function, the `isTargetValue` option should be passed to `resolveModuleThunk` or `resolveModuleValue`, because otherwise the target value could be mistakenly understood to be a `ModuleValueThunk`, and thus called when resolving the target value.

```typescript
import { ModuleThunk, resolveModuleThunk } from "module-thunk";

import { Cheese, defaultCheese } from "./cheese";

export interface CheesekakeOptions {
  cheese: ModuleThunk<Cheese>;
}

export async function makeCheesecake(options: CheesekakeOptions): { cake: Cheese } {
  const { cheese: cheeseThunk } = options;

  const cheese = await resolveModuleThunk(cheeseThunk, {
    isTargetValue: (value) => (value instanceof Cheese),
  });

  return { cake: cheese }
}

export async function makeDefaultCheesecake() {
  return makeCheescake({ cheese: defaultCheese })
}

export async function makeComplexCheescake() {
  return makeCheescake({ cheese: () => import("./complex-cheese") })
}
```

## Authors

- Ludvig Aldén [@ludvigalden](https://github.com/ludvigalden)

---

[MIT License.](https://github.com/ludvigalden/module-thunk/blob/master/LICENSE)
