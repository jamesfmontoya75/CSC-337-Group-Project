const express = require("express");
const session = require("express-session");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");

// In-memory "database"
const users = [{ username: 'adam', password: 'cool' }];

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (HTML, images, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

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
    (u) => u.username === req.body.username && u.password === req.body.password
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

// ------------------------
// MOVIES JSON ROUTE
// ------------------------
app.get("/movies", (req, res) => {
  res.type("application/json");
  res.sendFile(path.join(__dirname, "movies.json"));
});

// Movie details page (static)
const fs = require("fs");

// Route to show a specific movie by ID
app.get("/movie/:id", requireLogin, (req, res) => {
    const movieId = req.params.id;

    // Load movies JSON
    const moviesData = JSON.parse(fs.readFileSync(__dirname + "/movies.json", "utf-8"));

    // Flatten all movies into a single array
    const allMovies = [...moviesData.horror, ...moviesData.romantic, ...moviesData.action];

    // Find the movie with the matching ID
    const movie = allMovies.find(m => m.id == movieId);

    if (!movie) {
        return res.status(404).send("Movie not found");
    }

    // Send HTML with movie details dynamically
    res.send(`<!DOCTYPE html>
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
            <a class="link" href="#">Portfolio</a>
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
                       <button id="submitButton" type="submit">Add Movie</button>
                    </form>
                </div>
            </div>
        </div>
    </body>
</html>`);
});



app.post("/rent-movie", (req, res) => {
    try {
        // req.body.value comes from the <input name="value">
        console.log(req.body);
        const id = req.body.movieId;
        console.log("id", id);
        //console.log("Rented movie:", movie);

        // TODO: Handle the rental logic here (save to DB, etc.)
        
        //res.send("Movie rented successfully!");
        res.redirect("/movie/" + id);
    } catch (err) {
        console.error("Error processing /rent-movie:", err);
        res.status(500).send("Server error");
    }
});



// Start server
app.listen(8080, () => {
  console.log("Server Running on http://localhost:8080");
});
