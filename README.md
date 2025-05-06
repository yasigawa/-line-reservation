# LINE予約システム

LINE Messaging APIを使用した予約管理システムです。

## 機能

- LINE Messaging APIとの連携
- 予約の作成・管理
- 予約状況の確認
- 予約の変更・キャンセル

## 技術スタック

- Node.js
- Express.js
- MongoDB
- LINE Messaging API

## セットアップ

1. 必要なパッケージのインストール
```bash
npm install
```

2. 環境変数の設定
`.env`ファイルを作成し、以下の情報を設定してください：
```
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
LINE_CHANNEL_SECRET=your_channel_secret
MONGODB_URI=your_mongodb_uri
```

3. サーバーの起動
```bash
npm start
```

## ライセンス

MIT 