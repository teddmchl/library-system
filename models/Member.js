const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    memberNumber: { type: String, unique: true },
    memberSince: { type: Date, default: Date.now },
    status: { type: String, enum: ["active", "suspended", "expired"], default: "active" },
    address: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

/* Auto-generate member number before saving */
memberSchema.pre("save", async function (next) {
  if (!this.memberNumber) {
    const count = await mongoose.model("Member").countDocuments();
    this.memberNumber = `LIB-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

memberSchema.virtual("loans", {
  ref: "Loan",
  localField: "_id",
  foreignField: "member",
});

memberSchema.set("toJSON", { virtuals: true });
memberSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Member", memberSchema);
