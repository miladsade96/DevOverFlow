import { useSyncExternalStore } from "react";
const subscribe = (notify: () => void) => {
  window.addEventListener("popstate", notify);
  return () => window.removeEventListener("popstate", notify);
};
export function usePathname() {
  return useSyncExternalStore(subscribe, () => window.location.pathname);
}
export function useSearchParams() {
  const search = useSyncExternalStore(subscribe, () => window.location.search);
  return new URLSearchParams(search);
}
export function useParams<T>() {
  return { id: window.location.pathname.split("/").at(-1) } as T;
}
const router = {
  push(path: string) {
    window.history.pushState(null, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  },
  replace(path: string) {
    window.history.replaceState(null, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  },
  refresh() {},
  back() {
    window.history.back();
  },
};
export function useRouter() {
  return router;
}
