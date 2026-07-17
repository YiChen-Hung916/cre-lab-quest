# CRELab Quest：免費 Firebase 設定

本版本使用 Firebase **Spark 免費方案**：Google Authentication + Cloud Firestore。請不要綁定 Billing Account，也不要啟用 Cloud Storage 或 Cloud Functions。

## 1. 建立專案
1. 到 Firebase Console 建立專案。
2. 選擇 Spark 免費方案。
3. 新增 Web App。
4. 將 Web App 設定貼入 `firebase/firebase-config.js`。

## 2. Google 登入
1. Authentication → Sign-in method。
2. 啟用 Google。
3. Authentication → Settings → Authorized domains。
4. 加入 `yichen-hung916.github.io`（若網址不同，填入你的 GitHub Pages 網域）。

## 3. Firestore
1. 建立 Cloud Firestore database。
2. 將 `firebase/firestore.rules` 的內容貼到 Rules 並 Publish。
3. 玩家資料會儲存在 `users/{uid}`。

## 4. 設定只有你能使用的開發者模式
1. 先在遊戲中用自己的 Google 帳號登入。
2. Firebase Console → Authentication → Users，複製你的 UID。
3. Firestore 建立 collection：`admins`。
4. 建立 document，Document ID 填入你的 UID；內容可填 `enabled: true`。
5. 重新登入遊戲後，帳號面板會出現「啟用開發者模式」。

其他使用者即使登入，也不會看到開發者模式按鈕。`admins` 文件禁止由網頁端新增或修改。

## 5. 遊客與登入進度
- 遊客：進度存在瀏覽器 `localStorage`。
- 登入：進度同步至 Firestore。
- 第一次登入時，會合併本機與雲端進度，保留較前面的遊戲進度及較好的關卡結果。

## 免費用量注意
本遊戲只在開始、過關或登入合併時讀寫少量文件，適合小型實驗室活動使用。可在 Firebase Console 查看每日用量。
