# node-priority-queue

### 啟動伺服器
```
node priorityqueue.js
```

### 用戶訂閱條件
```
curl -X POST http://localhost:3000/subscribe \
-H "Content-Type: application/json" \
-d '{"userId": "User1", "stockSymbol": "AAPL", "condition": "<", "threshold": 80}'
```

### 更新價格（未觸發條件）
```
curl -X POST http://localhost:3000/updateStockPrice \
-H "Content-Type: application/json" \
-d '{"stockSymbol": "AAPL", "currentPrice": 88}'
```

### 列出所有用戶的訂閱條件
```
curl http://localhost:3000/listSubscriptions
```
#### 輸出結果
```
Map(3) {
  'User1' => [
    {
      stockSymbol: 'AAPL',
      condition: '<',
      threshold: 80,
      alerted: false
    },
    {
      stockSymbol: 'AAPL',
      condition: '>',
      threshold: 110,
      alerted: false
    }
  ],
  'User2' => [
    {
      stockSymbol: 'AAPL',
      condition: '>',
      threshold: 100,
      alerted: false
    }
  ],
  'User3' => [
    {
      stockSymbol: 'AAPL',
      condition: '<',
      threshold: 85,
      alerted: true
    }
  ]
}
```
