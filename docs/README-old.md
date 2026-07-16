# CRE Lab Quest V1

GitHub Pages 可直接部署的第一版網站骨架。

## 目前已完成
- 140關地圖與逐關解鎖
- 前20關儀器訓練架構，其中Level 1–19已有專屬互動：
  - Micropipette
  - Serological pipette
  - Centrifuge
  - Vortex／Incubator／設備流程
  - 96-well plate
  - Microscope
- Level 20新人Boss
- 第21關後14種模式掛載接口
- Boss 3／4／5回合規則
- 三項數值與過關判定
- 遊客 sessionStorage 暫存
- Research XP／Rank
- Firebase Spark用量估算面板
- 手機版響應式介面
- 無音效、無外部圖片依賴

## 尚待加入
- 14種模式正式核心玩法
- Google登入與Firestore永久存檔
- 每日抽獎
- 成就、稱號與Labpedia內容
- AI圖片替換與視覺優化

## 第一次使用GitHub
1. 登入GitHub。
2. 右上角「+」→ New repository。
3. Repository name 建議：`cre-lab-quest`
4. 設為 Public。
5. 不要勾選自動新增README，因為本資料夾已包含README。
6. 建立後，使用「uploading an existing file」上傳本資料夾所有檔案。
7. Settings → Pages → Deploy from a branch。
8. Branch選 `main`，folder選 `/ (root)`。
9. 儲存後等待GitHub產生網址。

## Firebase安全原則
- 使用Spark免費方案。
- 不建立或綁定Billing Account。
- 圖片、程式、關卡設定、Labpedia全部放GitHub。
- Firestore只存玩家進度、XP、道具、成就ID與日期。
- 只在登入、過關、抽獎時讀寫。
