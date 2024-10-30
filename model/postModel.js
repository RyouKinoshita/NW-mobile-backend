const mongoose = require("mongoose");

//schema
const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "please add post title"],
    },
    category: {
      type: String,
      required: [true, "please add post content"],
    },
    content: {
      type: String,
      required: true,
    },
    // description: {
    //   type: String,
    //   required: [true, "please add post description"],
    // },
    // postedBy: {
    //   type: mongoose.Schema.ObjectId,
    //   ref: "User",
    //   required: true,
    // },
    image: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);