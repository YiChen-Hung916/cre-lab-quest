# GitHub 網頁拖拉更新方式

本壓縮檔已保留 GitHub repository 的原始資料夾結構。

## 建議做法：分資料夾拖拉

GitHub 網頁一次上傳資料夾時，請進入對應目錄後再拖入該目錄內的檔案。

1. Repository 首頁：上傳 `index.html`、`README.md`、`FIREBASE-SETUP.md`、`UPDATE-005.md`。
2. 進入 `js/core/`：拖入 `app.js`。
3. 進入 `js/services/`：拖入 `storage.js`、`usage-monitor.js`。
4. 進入 `js/games/training/`：拖入 `training-games.js`。
5. 進入 `data/levels/`：拖入 `levels.js`。
6. 進入 `css/base/`：拖入 `app.css`。
7. 進入 `firebase/`：拖入該資料夾中的所有檔案。

每次上傳後，在頁面底部按 `Commit changes`。

## 不要這樣做

不要把最外層資料夾 `crelab-quest-integrated-drag-update/` 整個放進 repository，否則網站會多一層目錄而不會套用更新。

不要直接上傳 `.zip` 檔；GitHub Pages 不會自動解壓縮。

## Firebase

完成檔案上傳後，依 `FIREBASE-SETUP.md` 設定 Firebase。未填入 Firebase config 前，網站仍可使用遊客模式，但 Google 登入與雲端同步不會啟用。
