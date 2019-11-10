const { Schema, model } = require("mongoose");
const paginate = require("mongoose-paginate-v2");

// Define the Posts Schema
const PostSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    body: {
      type: String,
      required: true
    },
    imageURL: {
      type: String,
      required: false
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "users"
    }
  },
  { timestamps: true }
);

PostSchema.plugin(paginate);

module.exports = model("posts", PostSchema);
