const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    isbn: { type: String, required: true, unique: true, trim: true },
    genre: {
      type: String,
      required: true,
      enum: [
        "Fiction", "Non-Fiction", "Science", "History",
        "Biography", "Philosophy", "Poetry", "Mystery",
        "Science Fiction", "Children", "Art", "Technology",
      ],
    },
    description: { type: String, trim: true },
    publisher: { type: String, trim: true },
    publishedYear: { type: Number },
    pages: { type: Number },
    copies: { type: Number, default: 1, min: 1 },
    availableCopies: { type: Number, default: 1, min: 0 },
    coverColor: { type: String, default: "#8B6F47" },
    language: { type: String, default: "English" },
    location: { type: String, default: "General", trim: true },
  },
  { timestamps: true }
);

bookSchema.virtual("isAvailable").get(function () {
  return this.availableCopies > 0;
});

bookSchema.virtual("loans", {
  ref: "Loan",
  localField: "_id",
  foreignField: "book",
});

bookSchema.set("toJSON", { virtuals: true });
bookSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Book", bookSchema);
