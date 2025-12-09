const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");

// --- MongoDB helper ---
const { connectDB, getDB } = require("./db");

const app = express();

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// static files
app.use(express.static(path.join(__dirname, "public")));

// session
app.use(
  session({
    secret: "mysecretkey",
    resave: false,
    saveUninitialized: false,
  })
);

// require login middleware
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

// =======================
// CONNECT TO MONGO FIRST
// =======================
let db;

connectDB().then(() => {
  db = getDB();
  console.log("MongoDB connected.");
});

// =======================
// AUTH ROUTES
// =======================

// Register page
app.get("/register", (req, res) => {
  if (req.session.user) return res.redirect("/home");
  res.sendFile(path.join(__dirname, "public/register.html"));
});

// Register action
app.post("/register-action", async (req, res) => {
  const user = {
    username: req.body.username,
    password: req.body.password,
    rentedMovies: [] // <---- important!
  };

  await db.collection("users").insertOne(user);

  req.session.user = user;

  res.redirect("/home");
});

// Login page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public/login.html"));
});

// Login action
app.post("/login-action", async (req, res) => {
  const user = await db.collection("users").findOne({
    username: req.body.username,
    password: req.body.password,
  });

  if (!user) {
    return res.send(`
      <h1>Error 404: no such user found, please try again.</h1>
      <a href="/login">Login</a>
    `);
  }

  req.session.user = user;
  res.redirect("/home");
});

// home
app.get("/home", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// about
app.get("/about", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "public/about.html"));
});

// logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// =======================
// MOVIES COLLECTION API
// =======================

// serve movies.json for the frontend
app.get("/movies", (req, res) => {
  res.type("application/json");
  res.sendFile(path.join(__dirname, "movies.json"));
});

// show movie details page
app.get("/movie/:id", requireLogin, (req, res) => {
  const movieId = req.params.id;

  const moviesData = JSON.parse(
    fs.readFileSync(__dirname + "/movies.json", "utf-8")
  );

  const allMovies = [
    ...moviesData.horror,
    ...moviesData.romantic,
    ...moviesData.action,
  ];

  const movie = allMovies.find((m) => m.id == movieId);

  if (!movie) return res.status(404).send("Movie not found");

  // Same HTML you had before
  res.send(`
    <!DOCTYPE html>
    <html>
    <link rel="stylesheet" href="/styles/general.css"/>
    <style>
        html{
            height: 100%;
        }
        body{
            height: 102%;
            padding: 0px;
            margin: 0px;
            position: relative;
            top: -30px;
            
        }

        #headsection {
            height: 55px;                /* fixed height for consistency */
            width: 100%;
            font-size: 22px;
            text-align: center;
            background: black;
            color: yellow;
            border-bottom: 2px solid yellow;
            display: flex;
            align-items: center;         /* vertical centering */
            justify-content: center;     /* horizontal centering */
            position: fixed;
            top: 0;
            left: 0;
            z-index: 10;
            padding: 5px;
        }




        #logoutButton {
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 10;
        }


        #content{
            text-align: center;
            margin: 125px 0px 0px 225px;
        }

        #navbar {
            position: fixed;
            top: 55px;                   /* matches header height */
            left: 0;
            width: 200px;                /* clean, consistent width */
            height: calc(100vh - 55px); /* fill page below header */

            background: black;
            border-right: 1px solid yellow;

            display: flex;
            flex-direction: column;
            gap: 15px;                   /* spacing between links */
            
            padding: 20px;
            box-sizing: border-box;
            z-index: 5;
        }

        #navbar .link {
            color: black;
            text-decoration: none;
            font-size: 18px;
            padding: 5px 0;
            background-color: yellow;
            padding: 2.5px;
            font-weight: 600;
        }

        #navbar .link:hover {
            opacity: 0.6;
        }

        form {
            background-color: black;
        }

        .link{
            font-size: x-large;
            display: block;
        }
        #navhead{
            font-size: x-large;
            font-weight: 600;
        }

        #movie-container {
            display: inline-flex;
            flex-direction: row;
            text-align: left;
            width: fit-content; /* shrink to content size */
            margin: 0 auto;  /* center horizontally */
            background-color: yellow;
            color: black;
            gap: 20px;
        }

        .cover{
            width: 30%;
        }

        #submitButton {
            
        }

    </style>
    <body>
        <div id="headsection">
            <form action="/logout" method="get">
                <button id="logoutButton" type="submit">Logout</button>
            </form>
            <h1 id="header">Mockbuster</h1>
        </div>

        <div id="navbar">
            <h2 id="navhead">Navigation</h2>
            <a class="link" href="/about">About</a>
            <a class="link" href="/my-movies">My Movies</a>
            <a class="link" href="#">Contact</a>
        </div>

        <div id="content">
            <div id="movie-container">
                <img class="cover" src="${movie.cover}" />
                <div id="movie-info">
                    <h2>Title: ${movie.title}</h2>
                    <h4>Director: ${movie.director}</h4>
                    <h4>Released: ${movie.year}</h4>
                    <h4>Genre: ${movie.genre}</h4>

                    <form action="/rent-movie" method="post">
                       <input type="hidden" name="movieId" value="${movie.id}">
                       <button type="submit">Add Movie</button>
                    </form>
                </div>
            </div>
        </div>
    </body>
    </html>
  `);
});

// =======================
// RENT MOVIE (DB UPDATE)
// =======================
app.post("/rent-movie", requireLogin, async (req, res) => {
  try {
    const user = req.session.user;
    const movieId = req.body.movieId;

    console.log("User renting:", user.username, "Movie:", movieId);


    await db.collection("users").updateOne(
      { username: user.username },
      {
        $addToSet: { rentedMovies: movieId } // prevents duplicates
      }
    );

    if(user.rentedMovies.includes(movieId)){
      console.log("You already rented this movie.")
    }else{
      // update session user object too
      user.rentedMovies.push(movieId);
    }
    

    res.redirect("/movie/" + movieId);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Server error");
  }
});

app.get("/rate-movie", (req, res)=>{
  
})

app.get("/my-movies", async (req, res)=>{
  const user = req.session.user;

  if (!user) {
    return res.send(`
      <h1>Error 404: no such user found, please try again.</h1>
      <a href="/login">Login</a>
    `);
  }
  // console.log(user)
  res.sendFile(path.join(__dirname, "public/my-movies.html"));
  
})

app.get("/get-user", (req, res)=>{
  res.type("application/json");
  res.send(req.session.user);
})

// =======================
// START SERVER
// =======================
app.listen(8080, () => {
  console.log("Server Running on http://localhost:8080");
});
