const cors = require("cors");
const path = require("path");
const express = require("express");
const { connect } = require("mongoose");
const bodyParser = require("body-parser");
const { db, port } = require("./config/constants");
const passport = require("passport");

// Initialize the app
const app = express();

// Add middleware to our application
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "./public")));

app.use(passport.initialize());
require("./config/passport")(passport);

// Add Users Routes to express app
app.use("/api/users", require("./routes/users"));

// Add Posts Routes to express app
app.use("/api/posts", require("./routes/posts"));

const startServer = async () => {
  // Database Connection
  await connect(
    db,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
    .then(() => console.log(`Database connected succsfully\n${db}`))
    .catch(err => console.log("Unable to connect with the Database\n{err}"));
  // Listen for the server
  app.listen(port, () => console.log(`Server started on port ${port}`));
};

// Start the server
startServer();
