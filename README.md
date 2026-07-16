# CRELab Quest — Formal Project

這是 CRELab Quest 的正式專案起始版本，可直接部署到 GitHub Pages。

## 主要目錄

- `assets/images/`：所有圖片，已依內容與遊戲模式分層
- `css/`：版面與各遊戲樣式
- `js/core/`：應用程式核心
- `js/services/`：存檔、Firebase、用量監控
- `js/games/training/`：前20關儀器訓練
- `js/games/modes/`：14種正式玩法
- `js/games/boss/`：Boss隨機回合系統
- `data/`：140關、Labpedia、成就及每日獎勵
- `firebase/`：Firebase設定與Security Rules
- `docs/`：開發與部署文件

## 圖片分類規則

內容型圖片放在：
- `assets/images/instruments/`
- `assets/images/cells/`
- `assets/images/organoids/`
- `assets/images/dna/`
- `assets/images/western-blot/`
- `assets/images/prostate/`

僅屬於特定玩法的場景或物件放在：
- `assets/images/game-modes/<mode-name>/`

例如：
- 跑酷背景：`assets/images/game-modes/cancer-runner/`
- DNA泡泡：`assets/images/game-modes/dna-bubble/`
- 顯微鏡照片：`assets/images/cells/` 或 `assets/images/organoids/`
- Western blot參考圖：`assets/images/western-blot/reference/`

## 圖片命名

全部使用英文小寫與連字號，例如：

- `p200-pipette-front.webp`
- `prostate-cancer-cell-01.webp`
- `western-blot-reference-ar-01.webp`
- `cancer-runner-background-01.webp`

不要使用空格、中文檔名或 `image1.png` 這種無法辨識內容的名稱。

## 網路圖片

使用任何網路圖片前，將來源、作者與授權填入：

`assets/licenses/third-party-assets.csv`

無法確認授權的圖片不要使用。AI生成圖片則在notes欄標記 `AI-generated`。

## GitHub Pages

把本資料夾內所有內容上傳到repository根目錄，再到：

Settings → Pages → Deploy from a branch → main → /(root)

正式網址會是：

`https://你的帳號.github.io/crelab-quest/`
