module.exports = {
  db:
    process.env.NODE_ENV === "production"
      ? "mongoDB production URI"
      : "mongodb://localhost:27017/posts-app",
  appSecret:
    process.env.NODE_ENV === "production"
      ? "production_app_secret"
      : "development_app_secret",
  port: process.env.PORT || 5000
};
