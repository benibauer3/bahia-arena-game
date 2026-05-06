import { createContext, useContext } from "react";

export type ViewMode = "mobile" | "desktop";

export const ViewModeContext = createContext<ViewMode>("mobile");

export const useViewMode = () => useContext(ViewModeContext);
