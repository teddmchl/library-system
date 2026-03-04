const cron = require("node-cron");
const Loan = require("../models/Loan");

/**
 * Runs every 6 hours to mark active loans past their due date as "overdue".
 * This ensures statuses stay accurate without requiring a page visit.
 */
function startOverdueCron() {
  cron.schedule("0 */6 * * *", async () => {
    try {
      const result = await Loan.updateMany(
        { status: "active", dueAt: { $lt: new Date() } },
        { status: "overdue" }
      );
      if (result.modifiedCount > 0) {
        console.log(`[cron] Marked ${result.modifiedCount} loan(s) as overdue`);
      }
    } catch (err) {
      console.error("[cron] Overdue sync failed:", err.message);
    }
  });

  console.log("[cron] Overdue sync scheduled (every 6 hours)");
}

module.exports = { startOverdueCron };
