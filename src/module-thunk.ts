export function resolveModuleThunk<T, A extends any[] = any[]>(
    moduleThunk: ModuleThunk<T, A>,
    options: ResolveModuleThunkOptions<T, A> = {},
): T | Promise<T> {
    switch (typeof moduleThunk) {
        case "function":
            if (options.isTargetValue && options.isTargetValue(moduleThunk)) {
                return moduleThunk;
            }
            let args = options.args;
            if (options.argsThunk) {
                const resolvedArgs = resolveModuleThunk(options.argsThunk, {
                    isTargetValue(v): v is A {
                        return Array.isArray(v);
                    },
                });
                if (isPromise(resolvedArgs)) {
                    return resolvedArgs.then((args) => {
                        return resolveModuleValue<T>((moduleThunk as ModuleResolver<T, A>)(...((args || []) as A)), options);
                    });
                }
                args = resolvedArgs as A;
            }
            return resolveModuleValue<T>((moduleThunk as ModuleResolver<T, A>)(...((args || []) as A)), options);
        default:
            return resolveModuleValue<T>(moduleThunk as T, options);
    }
}

export function resolveModuleValue<T>(
    moduleValue: ModuleValue<T>,
    options: Pick<ResolveModuleThunkOptions<T, any[]>, "isTargetValue"> = {},
): T | Promise<T> {
    switch (typeof moduleValue) {
        case "undefined":
            return moduleValue as T;
        case "object":
            if (moduleValue === null) {
                return moduleValue as T;
            } else {
                if (isPromise(moduleValue)) {
                    return (moduleValue as Promise<ModuleValue<T>>).then((v) => resolveModuleValue<T>(v, options));
                } else if (options.isTargetValue) {
                    if (options.isTargetValue(moduleValue)) {
                        return moduleValue;
                    } else {
                        if (isDefaultExportModule(moduleValue)) {
                            return moduleValue["default"];
                        } else {
                            const foundTargetExportKey = Object.keys(moduleValue).find((key) =>
                                (options as any).isTargetValue(moduleValue[key]),
                            );
                            if (foundTargetExportKey) {
                                return moduleValue[foundTargetExportKey];
                            }
                        }
                    }
                }
            }
            return moduleValue as T;
        default:
            return moduleValue as T;
    }
}

export function moduleValueResolver<T>(
    moduleValue: ModuleValue<T>,
    options?: Pick<ResolveModuleThunkOptions<T, any[]>, "isTargetValue">,
): () => T | Promise<T> {
    let result: T | Promise<T>;
    const setResult = false;
    return function moduleValueResolver() {
        if (!setResult) {
            result = resolveModuleValue(moduleValue, options);
        }
        return result;
    };
}

export function moduleThunkResolver<T>(
    moduleValue: ModuleThunk<T>,
    options?: Pick<ResolveModuleThunkOptions<T, any[]>, "isTargetValue">,
): () => T | Promise<T> {
    let result: T | Promise<T>;
    const setResult = false;
    return function moduleValueResolver() {
        if (!setResult) {
            result = resolveModuleThunk(moduleValue, options);
        }
        return result;
    };
}

export function isDefaultExportModule<T>(v: object): v is DefaultExportModule<T> {
    return Boolean((v as any)["default"]);
}

export function isPromise<T>(v: any): v is Promise<T> {
    return Boolean(v && typeof v["then"] === "function");
}

export interface ResolveModuleThunkOptions<T, A extends any[] = any[]> {
    /** Arguments passed to the module thunk if it's not the target value. */
    args?: A;
    /** The arguments may be passed as a module thunk themselves, but no arguments will be passed to a function resolver of those args.
     * The returned value must be an array. */
    argsThunk?: ModuleThunk<A, []>;
    /** It may be difficult to determine whether passed module thunk is the target value.
     * The passed value will always be a non-null object or function. */
    isTargetValue?(v: any): v is T;
}

export type ResolvedModuleThunk<MT extends ModuleThunk<any, any>> = MT extends ModuleThunk<infer T, any> ? T | Promise<T> : any;

export type ModuleThunk<T, A extends any[] = any[]> = ModuleResolver<T, A> | ModuleValue<T>;

export interface ModuleResolver<T, A extends any[] = any[]> {
    /** Returns */
    (...args: A): ModuleValue<T>;
}

export type ModuleValue<T> = T | ModulePromise<T>;

export type ModulePromise<T> = Promise<Module<T>> | Promise<T> | Promise<DefaultExportModule<T>> | Promise<SingleExportModule<T>>;

export type Module<T> = T | DefaultExportModule<T> | SingleExportModule<T>;

export interface DefaultExportModule<T> {
    default: T;
}

export interface SingleExportModule<T> {
    [key: string]: T;
}
