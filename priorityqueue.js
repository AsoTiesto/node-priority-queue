const express = require("express");
const PriorityQueue = require("priorityqueuejs");

class StockAlertSystem {
  constructor() {
    this.userSubscriptions = new Map(); // 用戶訂閱條件
    this.queue = new PriorityQueue((a, b) => b.priority - a.priority); // 優先級從高到低
  }

  // 用戶訂閱股票條件
  subscribe(userId, stockSymbol, condition, threshold) {
    if (!this.userSubscriptions.has(userId)) {
      this.userSubscriptions.set(userId, []);
    }
    this.userSubscriptions
      .get(userId)
      .push({ stockSymbol, condition, threshold, alerted: false });

    console.log(
      `User ${userId} subscribed to ${stockSymbol} with condition "${condition} ${threshold}"`
    );

    // 列出當前 Queue 狀態
    this.printQueueStatus();
  }

  // 更新股票價格並即時提醒
  updateStockPrice(stockSymbol, currentPrice) {
    console.log(`Updating stock ${stockSymbol} to price $${currentPrice}`);

    for (const [userId, conditions] of this.userSubscriptions.entries()) {
      for (const condition of conditions) {
        // 檢查是否符合條件
        if (
          stockSymbol === condition.stockSymbol &&
          ((condition.condition === ">" &&
            currentPrice > condition.threshold) ||
            (condition.condition === "<" && currentPrice < condition.threshold))
        ) {
          // 如果未提醒過，立即發出警報
          if (!condition.alerted) {
            condition.alerted = true; // 標記為已提醒
            const priority = Math.abs(currentPrice - condition.threshold);

            const alert = {
              userId,
              stockSymbol,
              currentPrice,
              condition: `${condition.condition} ${condition.threshold}`,
              priority,
              message: `Stock ${stockSymbol} is at $${currentPrice}, which satisfies condition "${condition.condition} ${condition.threshold}"`,
            };

            this.queue.enq(alert); // 加入 Priority Queue
            console.log(`Alert for User ${userId}: ${alert.message}`);
          }
        } else if (
          condition.alerted &&
          ((condition.condition === ">" &&
            currentPrice <= condition.threshold) ||
            (condition.condition === "<" &&
              currentPrice >= condition.threshold))
        ) {
          // 如果價格回到範圍內，重置狀態
          condition.alerted = false;
        }
      }
    }

    // 即時處理警報並移除
    this.processAlerts();
  }

  // 即時處理警報並移除
  processAlerts() {
    const alertsToProcess = [];
    while (!this.queue.isEmpty()) {
      const alert = this.queue.deq();
      alertsToProcess.push(alert);
      console.log(
        `Processing alert for User ${alert.userId}: ${alert.message} (Priority: ${alert.priority})`
      );
    }

    return alertsToProcess;
  }

  // 列出 Priority Queue 中所有未處理的警報
  printQueueStatus() {
    const queueArray = [];
    const tempQueue = new PriorityQueue(this.queue._comparator); // 複製 Queue

    while (!this.queue.isEmpty()) {
      const alert = this.queue.deq();
      queueArray.push(alert);
      tempQueue.enq(alert);
    }

    // 恢復原始 Queue 狀態
    this.queue = tempQueue;
  }
}

// 創建股票警報系統實例
const stockAlertSystem = new StockAlertSystem();
const app = express();
const PORT = 3000;

app.use(express.json());

// API 1: 用戶訂閱股票條件
app.post("/subscribe", (req, res) => {
  const { userId, stockSymbol, condition, threshold } = req.body;

  if (!userId || !stockSymbol || !condition || threshold === undefined) {
    return res.status(400).send("Missing required parameters.");
  }

  stockAlertSystem.subscribe(userId, stockSymbol, condition, threshold);
  res.send(
    `User ${userId} subscribed to ${stockSymbol} with condition "${condition} ${threshold}"`
  );
});

// API 2: 更新股票價格
app.post("/updateStockPrice", (req, res) => {
  const { stockSymbol, currentPrice } = req.body;

  if (!stockSymbol || currentPrice === undefined) {
    return res.status(400).send("Missing required parameters.");
  }

  stockAlertSystem.updateStockPrice(stockSymbol, currentPrice); // 即時檢查並提醒
  res.send(`Stock ${stockSymbol} updated to price $${currentPrice}`);
});

// API 3: 列出 Priority Queue 狀態
app.get("/queueStatus", (req, res) => {
  const queueArray = [];
  const tempQueue = new PriorityQueue(stockAlertSystem.queue._comparator);

  while (!stockAlertSystem.queue.isEmpty()) {
    const alert = stockAlertSystem.queue.deq();
    queueArray.push(alert);
    tempQueue.enq(alert);
  }

  // 恢復 Queue 狀態
  stockAlertSystem.queue = tempQueue;

  res.send(
    queueArray.length > 0 ? queueArray : "No pending alerts in Priority Queue."
  );
});

// API 4: 列出所有用戶的訂閱條件
app.get("/listSubscriptions", (req, res) => {
  const subscriptions = [];
  for (const [
    userId,
    conditions,
  ] of stockAlertSystem.userSubscriptions.entries()) {
    subscriptions.push({
      userId,
      conditions,
    });
  }

  res.send(
    subscriptions.length > 0 ? subscriptions : "No subscriptions found."
  );
});

// 啟動服務器
app.listen(PORT, () => {
  console.log(`Stock Alert System running on http://localhost:${PORT}`);
});
