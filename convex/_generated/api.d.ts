/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ResendOTPPasswordReset from "../ResendOTPPasswordReset.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as customers from "../customers.js";
import type * as dashboard from "../dashboard.js";
import type * as http from "../http.js";
import type * as interactions from "../interactions.js";
import type * as model_access from "../model/access.js";
import type * as nextSteps from "../nextSteps.js";
import type * as opportunities from "../opportunities.js";
import type * as products from "../products.js";
import type * as pushInternal from "../pushInternal.js";
import type * as pushSubscriptions from "../pushSubscriptions.js";
import type * as quotes from "../quotes.js";
import type * as repurchaseReminders from "../repurchaseReminders.js";
import type * as stores from "../stores.js";
import type * as storesLogo from "../storesLogo.js";
import type * as users from "../users.js";
import type * as webPush from "../webPush.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ResendOTPPasswordReset: typeof ResendOTPPasswordReset;
  auth: typeof auth;
  crons: typeof crons;
  customers: typeof customers;
  dashboard: typeof dashboard;
  http: typeof http;
  interactions: typeof interactions;
  "model/access": typeof model_access;
  nextSteps: typeof nextSteps;
  opportunities: typeof opportunities;
  products: typeof products;
  pushInternal: typeof pushInternal;
  pushSubscriptions: typeof pushSubscriptions;
  quotes: typeof quotes;
  repurchaseReminders: typeof repurchaseReminders;
  stores: typeof stores;
  storesLogo: typeof storesLogo;
  users: typeof users;
  webPush: typeof webPush;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
