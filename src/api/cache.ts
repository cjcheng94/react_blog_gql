import { makeVar } from "@apollo/client";

export const darkModeVar = makeVar(false);
export const loadingVar = makeVar(false);
export const searchOverlayVar = makeVar(false);
export const drawerVar = makeVar(false);
export const sortLatestFirstVar = makeVar(false);
export const accountDialogTypeVar = makeVar<"" | "login" | "signup">("");