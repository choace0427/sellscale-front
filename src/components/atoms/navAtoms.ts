import { atom } from "recoil";

const navTabState = atom({
  key: "nav-tab",
  default: 'home',
});

const navLoadingState = atom({
  key: "nav-loading",
  default: false,
});

export {
  navTabState,
  navLoadingState,
};
