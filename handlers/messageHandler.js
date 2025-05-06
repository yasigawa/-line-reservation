const Reservation = require('../models/Reservation');
const { Client } = require('@line/bot-sdk');

class MessageHandler {
  constructor(config) {
    this.client = new Client(config);
  }

  async handleMessage(event) {
    const message = event.message.text;
    const userId = event.source.userId;
    const replyToken = event.replyToken;

    try {
      // 予約確認コマンド
      if (message === '予約確認') {
        await this.handleReservationCheck(userId, replyToken);
      }
      // 予約作成コマンド
      else if (message.startsWith('予約')) {
        await this.handleReservation(message, userId, replyToken);
      }
      // 予約キャンセルコマンド
      else if (message.startsWith('キャンセル')) {
        await this.handleReservationCancel(message, userId, replyToken);
      }
      // ヘルプコマンド
      else if (message === 'ヘルプ') {
        await this.sendHelpMessage(replyToken);
      }
      // その他のメッセージ
      else {
        await this.sendDefaultMessage(replyToken);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      await this.sendErrorMessage(replyToken);
    }
  }

  async handleReservation(message, userId, replyToken) {
    // 予約情報の解析
    const parts = message.split(' ');
    if (parts.length < 4) {
      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: '予約フォーマットが正しくありません。\n例: 予約 2023/05/01 14:00 サービス名'
      });
      return;
    }

    const [_, date, time, service] = parts;
    const reservation = new Reservation({
      userId,
      userName: 'User', // LINEのユーザー名を取得する場合は別途実装
      date: new Date(date),
      time,
      service,
      status: 'pending'
    });

    await reservation.save();
    await this.client.replyMessage(replyToken, {
      type: 'text',
      text: `予約を受け付けました。\n日時: ${date} ${time}\nサービス: ${service}`
    });
  }

  async handleReservationCheck(userId, replyToken) {
    const reservations = await Reservation.find({ userId, status: 'pending' });
    if (reservations.length === 0) {
      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: '現在の予約はありません。'
      });
      return;
    }

    const message = reservations.map(res => 
      `日時: ${res.date.toLocaleDateString()} ${res.time}\nサービス: ${res.service}`
    ).join('\n\n');

    await this.client.replyMessage(replyToken, {
      type: 'text',
      text: `現在の予約一覧:\n\n${message}`
    });
  }

  async handleReservationCancel(message, userId, replyToken) {
    const parts = message.split(' ');
    if (parts.length < 2) {
      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: 'キャンセルフォーマットが正しくありません。\n例: キャンセル 2023/05/01'
      });
      return;
    }

    const date = new Date(parts[1]);
    const reservation = await Reservation.findOne({
      userId,
      date,
      status: 'pending'
    });

    if (!reservation) {
      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: '指定された日付の予約が見つかりません。'
      });
      return;
    }

    reservation.status = 'cancelled';
    await reservation.save();
    await this.client.replyMessage(replyToken, {
      type: 'text',
      text: '予約をキャンセルしました。'
    });
  }

  async sendHelpMessage(replyToken) {
    await this.client.replyMessage(replyToken, {
      type: 'text',
      text: `利用可能なコマンド:\n
・予約 [日付] [時間] [サービス名] - 予約を作成
・予約確認 - 現在の予約を確認
・キャンセル [日付] - 予約をキャンセル
・ヘルプ - このヘルプメッセージを表示`
    });
  }

  async sendDefaultMessage(replyToken) {
    await this.client.replyMessage(replyToken, {
      type: 'text',
      text: '予約システムへようこそ！\n「ヘルプ」と入力すると利用可能なコマンドが表示されます。'
    });
  }

  async sendErrorMessage(replyToken) {
    await this.client.replyMessage(replyToken, {
      type: 'text',
      text: 'エラーが発生しました。もう一度お試しください。'
    });
  }
}

module.exports = MessageHandler; 