require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const expressLayouts = require("express-ejs-layouts");
const methodOverride = require("method-override");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const morgan = require("morgan");
const helmet = require("helmet");
const path = require("path");
const { startOverdueCron } = require("./cron/overdueSync");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/library";

/* ── Security ── */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
      },
    },
  })
);

/* ── Database ── */
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    startOverdueCron();
  })
  .catch((err) => console.error("MongoDB error:", err));

/* ── View Engine ── */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout");

/* ── Middleware ── */
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(express.json({ limit: "10kb" }));
app.use(methodOverride("_method"));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "library-dev-secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGODB_URI,
      touchAfter: 24 * 3600, // only update session once per 24h unless data changed
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);
app.use(flash());

/* ── Global template locals ── */
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentPath = req.path;
  next();
});

/* ── Routes ── */
app.use("/", require("./routes/index"));
app.use("/books", require("./routes/books"));
app.use("/members", require("./routes/members"));
app.use("/loans", require("./routes/loans"));

/* ── 404 ── */
app.use((req, res) => {
  res.status(404).render("404", { title: "Page Not Found" });
});

/* ── Global Error Handler ── */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).render("404", {
    title: status === 404 ? "Page Not Found" : "Something Went Wrong",
  });
});

app.listen(PORT, () => {
  console.log(`Ashbrook Library running at http://localhost:${PORT}`);
});
