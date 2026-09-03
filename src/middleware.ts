import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip all paths that are not part of the public site (API, static files, _next)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
