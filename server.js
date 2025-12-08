const express = require("express");
const session = require("express-session");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");

// In-memory "database"
const users = [{username: 'adam', password: 'cool'}];

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (HTML, images, CSS, JS)
app.use(express.static("public"));

// SESSION middleware
app.use(
  session({
    secret: "mysecretkey",          
    resave: false,
    saveUninitialized: false,
  })
);

// AUTH middleware
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

// ================= ROUTES =================

// Register page
app.get("/register", (req, res) => {
  if (req.session.user) return res.redirect("/home");

  res.sendFile(path.join(__dirname, "public/register.html"));
});

// Register action
app.post("/register-action", (req, res) => {
  const user = {
    username: req.body.username,
    password: req.body.password,
  };

  users.push(user);

  req.session.user = user;

  res.redirect("/home");
});

// Login page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public/login.html"));
});

// Login action
app.post("/login-action", (req, res) => {
  console.log(req.body);
  const user = users.find(
    (u) =>
      u.username === req.body.username &&
      u.password === req.body.password
  );

  if (!user) {
    return res.send(`
      <h1>Error 404: no such user found, please try to login again.</h1>
      <a href="/login">Login</a>
    `);
  }

  req.session.user = user;

  res.redirect("/home");
});

// Home page (protected)
app.get("/home", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// About page (protected)
app.get("/about", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "public/about.html"));
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.listen(8080, () => {
  console.log("Server Running");
});
