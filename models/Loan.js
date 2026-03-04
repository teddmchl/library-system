const mongoose = require("mongoose");

const LOAN_DAYS = 14;

const loanSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true },
    borrowedAt: { type: Date, default: Date.now },
    dueAt: {
      type: Date,
      default: () => {
        const d = new Date();
        d.setDate(d.getDate() + LOAN_DAYS);
        return d;
      },
    },
    returnedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["active", "returned", "overdue"],
      default: "active",
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

/* Computed virtuals */
loanSchema.virtual("isOverdue").get(function () {
  if (this.returnedAt) return false;
  return new Date() > this.dueAt;
});

loanSchema.virtual("daysOverdue").get(function () {
  if (!this.isOverdue) return 0;
  return Math.floor((new Date() - this.dueAt) / (1000 * 60 * 60 * 24));
});

loanSchema.virtual("daysRemaining").get(function () {
  if (this.returnedAt) return 0;
  const diff = this.dueAt - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

/* Auto-mark overdue on query */
loanSchema.pre(/^find/, function (next) {
  this.populate("book").populate("member");
  next();
});

loanSchema.set("toJSON", { virtuals: true });
loanSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Loan", loanSchema);
