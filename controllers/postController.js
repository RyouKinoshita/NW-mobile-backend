const postModel = require("../model/postModel");
const {cloudinary, secretKey} = require('../config/cloudinaryConfig')

// create post
const createPostController = async (req, res) => {
  try {
    const result = await cloudinary.v2.uploader.upload(
      req.file.path,
      {
        folder: "avatars",
        width: 200,
        crop: "scale",
      },
      (err, res) => {
        console.log(err, res);
      }
    );
  
    const { title, category, content } = req.body;
  
    const post = await postModel.create({
      title,
      category,
      content,
      image: {
        public_id: result.public_id,
        url: result.url,
      },
    });
    res.status(200).send({
      success: true,
      message: "Create Post Successfully",
      post
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error In Post API",
      error,
    });
  }
};

// GET ALL POSTS
const getAllPostsContoller = async (req, res) => {
  try {
    const posts = await postModel
      .find()
      .populate("postedBy", "_id name")
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      message: "All Posts Data",
      posts,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error In GETALLPOSTS API",
      error,
    });
  }
};

// get user posts
const getUserPostsController = async (req, res) => {
  try {
    const userPosts = await postModel.find({ postedBy: req.auth._id });
    res.status(200).send({
      success: true,
      message: "user posts",
      userPosts,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in User POST API",
      error,
    });
  }
};

// delete post
const deletePostController = async (req, res) => {
  try {
    const { id } = req.params;
    await postModel.findByIdAndDelete({ _id: id });
    res.status(200).send({
      success: true,
      message: "Your Post been deleted!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "error in delete post api",
      error,
    });
  }
};

//UPDATE POST
const updatePostController = async (req, res) => {
  try {
    const { title, description } = req.body;
    //post find
    const post = await postModel.findById({ _id: req.params.id });
    //validation
    if (!title || !description) {
      return res.status(500).send({
        success: false,
        message: "Please Provide post title or description",
      });
    }
    const updatedPost = await postModel.findByIdAndUpdate(
      { _id: req.params.id },
      {
        title: title || post?.title,
        description: description || post?.description,
      },
      { new: true }
    );
    res.status(200).send({
      success: true,
      message: "Post Updated Successfully",
      updatedPost,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Errro in update post api",
      error,
    });
  }
};

module.exports = {
  createPostController,
  getAllPostsContoller,
  getUserPostsController,
  deletePostController,
  updatePostController,
};