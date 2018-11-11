// modules

 const express = require("express");
 const bodyParser = require("body-parser");
 const cookieSession = require('cookie-session');  // session cookies - cookies that expire after a browser is closed
 const bcrypt = require('bcrypt');
 const app = express();

// environment

 const PORT = process.env.PORT || 8080; // default port 8080
 app.set('view engine', 'ejs');
 app.use(bodyParser.urlencoded({ extended: true }));
 app.use(cookieSession({
   name: "session",
   keys: ["secretsecret"],
   maxAge: 60 * 60 * 1000 // session cookie time length
 }));

 // global objects

 const urlDatabase = {
   "b2xVn2": {
     url: "http://www.lighthouselabs.ca",
     userID: "userRandomID"
   },
   "9sm5xK": {
     url: "http://www.google.com",
     userID: "user2RandomID"
   }
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
 };

//functions


 function generateRandomString() {
   return  Math.random().toString(36).replace('0.', '') .slice(5); // 36 = 36 alpha-numerical characters with which to generate newSURL
   };


 function insertUrl(longUrl, user) {
   let newShortUrl = "";

   do {
     newShortUrl = generateRandomString();
   } while(urlDatabase[newShortUrl])
   urlDatabase[newShortUrl] = { url: longUrl, userID: user };
   return newShortUrl;
 }


 function usersURLS(id) {
   let subset = {};
   for (let url in urlDatabase) {
     if (urlDatabase[url].userID === id) {
       subset[url] = urlDatabase[url];
     }
   }
   return subset;
}


 function addUser(email, password) {
   let newUserId = "";

   do {
     newUserId = generateRandomString();
   } while(users[newUserId])
   users[newUserId] = {
     id: newUserId,
     email: email,
     password: bcrypt.hashSync(password, 10)
   };
   return newUserId;
 }


 function canRegistered(email) {
   let flag = true;
   for (let user in users) {
     if (users[user].email === email) {
       return false;
     }
   }
   return true;
 }


 function findUser(email, password) {
   for (let user in users) {
     if (users[user].email === email
       && bcrypt.compareSync(password, users[user].password)) {
       return user;
     }
   }
   return "";
 }


// Get req's

app.get("/", (req, res) => {
  let userId = req.session.user_id;
  if (!userId || !users[userId]) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});
 app.get("/urls.json", (req, res) => {
   res.json(urlDatabase);
 });

 app.get("/users.json", (req, res) => {
   res.json(users);
 });

 app.get("/urls", (req, res) => {
  let userId = req.session.user_id;
  let urls = usersURLS(userId);
  if (!userId || !users[userId]) {
        res.redirect("/login");
  } else {
    let templateVars = {
      urls: urls,
       user: users[userId].email
     };
     res.render("urls_index", templateVars);
   }
 });


 app.get("/urls/new", (req, res) => {
   let userId = req.session.user_id;
   if(!userId || !users[userId]) {
     res.redirect("/login");
   } else {
     let templateVars = {
       user: users[userId].email
     };
     res.render("urls_new", templateVars);
   }
 });


 app.get("/urls/:id", (req, res) => {
  let shortUrl = req.params.id;
  let userId = req.session.user_id;
  if(!userId || !users[userId]) {
        res.sendStatus(401);
  } else if (!urlDatabase[shortUrl]){
        res.sendStatus(404);
  }  else if (urlDatabase[shortUrl].userID !== userId) {
    res.sendStatus(403);
  } else {
    let templateVars = {
      shortUrl: shortUrl,
       url: urlDatabase[shortUrl].url,
       user: users[userId].email
     };
     res.render("urls_show", templateVars);
   }
});
 app.get("/u/:shortURL", (req,res) => {
  let shortUrl = req.params.shortURL;
  if(!urlDatabase[shortUrl]) {
    res.sendStatus(404);
  } else {
    res.redirect(urlDatabase[shortUrl].url);
  }
});
 app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});
 app.get("/register", (req, res) => {
   let userId = req.session.user_id;
  if(!userId || !users[userId]) {
    res.render("register", { errMsg: "" });
  } else {
    res.redirect("/urls");
  }
});
 app.get("/login", (req, res) => {
  let userId = req.session.user_id;
  if(!userId || !users[userId]) {
    res.render("login", {});
  } else {
    res.redirect("/urls");
  }
});

 // post req's

app.post("/urls/:id/delete", (req, res) => {
   let userId = req.session.user_id;
  if(!userId || !users[userId]) {
    res.sendStatus(401);
  } else {
     let shortUrl = req.params.id;
    if (!urlDatabase[shortUrl]) {
      res.sendStatus(400);
    } else if (req.session.user_id === urlDatabase[shortUrl].userID) {
      delete urlDatabase[req.params.id];
      res.redirect("/urls");
    } else {
      res.sendStatus(403);
    }
  }
});

app.post("/urls/:id", (req, res) => {
  let userId = req.session.user_id;
  if(!userId || !users[userId]) {
    res.sendStatus(401);
  } else {
    if (req.session.user_id === urlDatabase[req.params.id].userID) {
      urlDatabase[req.params.id].url = req.body.newURL;
      res.redirect("/urls");
    } else {
      res.sendStatus(403);
    }
  }
});

// redirect to edit page
app.post("/urls", (req, res) => {
  let userId = req.session.user_id;
  if(!userId || !users[userId]) {
    res.sendStatus(401);  // Unauthorized
  } else {
    let shortURL = insertUrl(req.body.longURL, userId);
    res.redirect(`/urls/${shortURL}`);
  }
});

//  login

app.post("/login", (req, res) => {
  if (!req.body.email || !req.body.password) {
        res.sendStatus(400);  // Bad Request
  } else {
    let userId = findUser(req.body.email, req.body.password);
    if (!userId) {
      res.sendStatus(403);  // Forbidden
    } else {
      req.session.user_id = userId;
      res.redirect("/urls");
    }
  }
});
 // logout
 app.post("/logout", (req, res) => {
   req.session.user_id = null;
   res.redirect("/urls");
 });

 // register

app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  if (!email || !password) {
    res.sendStatus(400);
  } else {
    if (canRegistered(email)) {
      let userId = addUser(email, password);
      req.session.user_id = userId;
      res.redirect("/urls");
    } else {
      res.render("register", { errMsg: `${email} had already been registered.` });
    }
  }
});
app.listen(PORT, () => {
   console.log(`TinyApp listening on port ${PORT}!`);
 });