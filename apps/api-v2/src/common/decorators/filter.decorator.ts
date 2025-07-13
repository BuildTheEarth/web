import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { FILTER_META, FilteredOptions } from "./filtered.decorator";

// T is a union of string keys, e.g. 'name' | 'age'
export interface FilterParams<T extends string = string> {
  filter: { [K in T]?: any };
}

/**
 * Decorator to extract filtering parameters from the request.
 */
export const Filter = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const reflector = new Reflector();
    const handler = ctx.getHandler();

    const filterMeta: FilteredOptions =
      reflector.get(FILTER_META, handler) || {};
    const { fields } = filterMeta;

    const query = request.query;

    if (!fields || fields.length === 0) {
      return { filter: {} };
    }

    const filter: FilterParams["filter"] = {};

    fields.forEach((field) => {
      const fieldName = field.name;
      const value = query[fieldName];
      if (value !== undefined) {
        // Type validation
        switch (field.type) {
          case Number:
            if (!isNaN(Number(value))) {
              filter[fieldName] = Number(value);
            }
            break;
          case Boolean:
            if (value === "true" || value === "false") {
              filter[fieldName] = value === "true";
            }
            break;
          case String:
            filter[fieldName] = String(value);
            break;
          default:
            filter[fieldName] = value;
        }
      }
    });

    return { filter };
  },
);
