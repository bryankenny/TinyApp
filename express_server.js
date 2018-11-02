

function generateRandomString() {
 return  Math.random().toString(36).replace('0.', '') .slice(5);
 };

const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser")

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2" : "http://www.lighthouselabs.ca",
  "9sm5xK" : "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

app.post("/urls", (req, res) => {
  console.log(req.body);  // debug statement to see POST parameters
  //res.send("Ok");         // Respond with 'Ok' (we will replace this)
  let sURL = generateRandomString();
  urlDatabase[sURL] = req.body.longURL;
  res.redirect('/urls/'    );
});

app.post("/urls/:id/delete", (req, res) => {
   let shortURL = urlDatabase[req.params.shortURL];
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
  console.log(req.params.id)
});

app.post("/urls/:id/update", (req, res) => {
  console.log(req.body);
  urlDatabase[req.params.id] = req.body.newURL
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls")
});

app.post("/logout", (req, res)=>{
    res.clearCookie("username");
    res.redirect('/urls')
})

app.post("/registration", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let newUserID = generateRandomString();
  users[newUserID] = {
    email: email,
    password: password,
    id: newUserID
  }
  if (!req.body.email || !req.body.password) {
        res.status(400).send("Email and/or password field incomplete");
    }
    for (let i in users) {
        if (users[newUserID].email === users[i].email) {
        res.status(400).send("User email already registered")
    }
}
  res.cookie("user_id", req.body.newUserID);
    console.log(users)
    res.redirect('/urls')
})

app.get("/", (req, res) => {
  res.redirect('/urls/new');
});

app.get("/registration", (req, res) => {
  let templateVar = {
  username: req.cookies["username"], url: urlDatabase };
  res.render("registration", templateVar);
})

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
  console.log(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  let templateVar = {
  username: req.cookies["username"], url: urlDatabase };
  res.render("urls_new", templateVar);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
    let templateVar = {
  username: req.cookies["username"], url: urlDatabase };
  res.render("urls_index.ejs", templateVar);
});

app.get("/urls/:id", (req, res) => {
 let templateVars = {
  username: req.cookies["username"], shortURL: req.params.id, longURL: urlDatabase[req.params.id]};
  res.render("urls_show", templateVars);
 });



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
