const express = require("express");
const upload = require("../utils/multer");
const {
  createPostController,
  getAllPostsContoller,
  getUserPostsController,
  deletePostController,
  updatePostController,
} = require("../controllers/postController");

//router object
const router = express.Router();

// CREATE POST || POST
router.post("/create-post", upload.single("image"), createPostController);

//GET ALL POSTs
router.get("/get-all-post", getAllPostsContoller);

//GET USER POSTs
router.get("/get-user-post", getUserPostsController);

//DELEET POST
router.delete("/delete-post/:id", deletePostController);

//UPDATE POST
router.put("/update-post/:id", updatePostController);

//export
module.exports = router;