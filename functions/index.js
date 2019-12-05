const functions = require("firebase-functions");
const admin = require("firebase-admin");
const app = require("express")();
const firebase = require("firebase");
admin.initializeApp();
const firebaseConfig = {
  apiKey: "AIzaSyAHAg9wGwTv1q-yuWecNfFQjDrDCfVdPsg",
  authDomain: "socialapp-2ff82.firebaseapp.com",
  databaseURL: "https://socialapp-2ff82.firebaseio.com",
  projectId: "socialapp-2ff82",
  storageBucket: "socialapp-2ff82.appspot.com",
  messagingSenderId: "496909097414",
  appId: "1:496909097414:web:fc976cdfd18ef9e30b3ac7",
  measurementId: "G-GDPZ1KXKP6"
};
const db = admin.firestore();

firebase.initializeApp(firebaseConfig);
app.get("/screams", (req, res) => {
  db.collection("screams")
    .get()
    .then(data => {
      let screams = [];
      data.forEach(doc =>
        screams.push({
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt
        })
      );
      return res.json(screams);
    })
    .catch(err => console.error(err));
});

app.post("/screams", (req, res) => {
  const newScream = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString()
  };
  db.collection("screams")
    .add(newScream)
    .then(doc => {
      res.json({ message: `document ${doc.id} created successfully` });
    })
    .catch(err => {
      res.status(500).json({ error: "somering wrong" });
      console.error(err);
    });
});

//signup route
app.post("/signup", (req, res) => {
  let token, userId;
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };
  //validation
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({ handle: "this handle is already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(idToken => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId
      };

      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => res.status(201).json({ token }))
    .catch(err => {
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "Email is already is use" });
      } else {
        res.status(500).json({ error: err.code });
      }
    });
});

exports.api = functions.https.onRequest(app);
