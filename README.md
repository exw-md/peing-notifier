# 質問箱 to Discord

## 設定方法

1. これを Fork
2. IFTTT で Webhook -> Discord を設定
3. 環境変数を GitHub シークレットに設定

## 環境変数

```bash
export APP_COOKIE="質問箱のCookie"
export APP_IFTTT_EVENT_NAME="IFTTTのイベント名"
export APP_IFTTT_SERVICE_KEY="IFTTTのサービスキー"
export APP_FIREBASE_COLLECTION_ID="永続化用のFireStoreのコレクションID"
export APP_FIREBASE_DOCUMENT_ID="永続化用のFireStoreのドキュメントID"
export APP_FIREBASE_API_KEY="永続化用のFirebaseのAPIキー"
export APP_FIREBASE_PROJECT_ID="永続化用のFirebaseのプロジェクトID"
```

## LICENCE

MIT
