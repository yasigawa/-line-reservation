require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const mongoose = require('mongoose');
const MessageHandler = require('./handlers/messageHandler');

const app = express();

// LINE Botの設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

// メッセージハンドラーの初期化
const messageHandler = new MessageHandler(config);

// MongoDB接続
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// LINE Webhook（express.json()やurlencoded()を適用しない！）
app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error('Webhook Error:', err);
      res.status(500).end();
    });
});

// テスト用エンドポイントのみ express.json() を適用
app.post('/test-webhook', express.json(), async (req, res) => {
  if (!req.body.events) {
    return res.status(400).json({ error: 'eventsフィールドが必要です' });
  }
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Test Webhook Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// イベントハンドラー
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  try {
    await messageHandler.handleMessage(event);
  } catch (error) {
    console.error('Error in handleEvent:', error);
  }
  return Promise.resolve(null);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 