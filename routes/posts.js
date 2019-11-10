const fs = require("fs");
const path = require("path");
const psp = require("passport");
const multer = require("multer");
const Post = require("../models/Post");
const User = require("../models/User");
const router = require("express").Router();

const storage = multer.diskStorage({
  destination: (req, file, done) => done(null, "public/uploads/images"),
  filename: (req, file, done) => {
    let lastIndex = file.originalname.lastIndexOf(".");
    let extension = file.originalname.substring(lastIndex);
    done(null, `${Date.now()}${extension}`);
  }
});

const upload = multer({ storage });

const customLabels = {
  totalDocs: "postCount",
  docs: "postList",
  page: "currentPage",
  nextPage: "next",
  prevPage: "prev",
  totalPages: "pageCount",
  pagingCounter: "slNo",
  meta: "paginator"
};

/**
 * @DESC To create a post
 * @ACCESS Private
 * @TYPE POST
 * @BODY { title*, body*, postImage }
 * @ROUTE /api/posts
 */
router.post(
  "/",
  psp.authenticate("jwt", { session: false }),
  upload.single("postImage"),
  async (req, res) => {
    try {
      let newPost = new Post({
        ...req.body,
        user: req.user._id
      });
      if (req.file) {
        newPost.imageURL = req.file.path.replace("public", "");
      }
      let result = await newPost.save();
      return res.status(201).json({
        msg: "Post created successfully",
        success: true,
        post: result
      });
    } catch (err) {
      return res.status(403).json({
        msg: "Unable to create the post.",
        success: false
      });
    }
  }
);

/**
 * @DESC To Edit a post by ID
 * @ACCESS Private
 * @TYPE PUT
 * @PARAM { id }
 * @BODY { title*, body*, postImage }
 * @ROUTE /api/posts/:id
 */
router.put(
  "/:id",
  psp.authenticate("jwt", { session: false }),
  upload.single("postImage"),
  async (req, res) => {
    await postUtility(req, res, "edit");
  }
);

/**
 * @DESC To Delete a post by ID
 * @ACCESS Private
 * @TYPE DELETE
 * @PARAMS { id* }
 * @ROUTE /api/posts
 */
router.delete(
  "/:id",
  psp.authenticate("jwt", { session: false }),
  async (req, res) => {
    await postUtility(req, res, "delete");
  }
);

/**
 * @DESC To GET all of user posts by username
 * @ACCESS Public
 * @TYPE GET
 * @ROUTE /api/posts/users-posts?username=
 */
router.get("/users-posts", async (req, res) => {
  try {
    let { username, page } = req.query;
    let { _id } = await User.findOne({ username });
    if (!_id) {
      throw new Error("User not found");
    }
    const options = {
      limit: 10,
      page: page || 1,
      sort: { createdAt: -1 },
      customLabels,
      populate: [
        {
          path: "user",
          select: "firstName lastName username"
        }
      ]
    };
    let results = await Post.paginate({ user: _id.toString() }, options);
    return res.json(results);
  } catch (err) {
    return res.status(404).json({ msg: "User not found." });
  }
});

/**
 * @DESC To Get a post by ID
 * @ACCESS Public
 * @TYPE GET
 * @QUERY { id* }
 * @ROUTE /api/posts?id=
 */
router.get("/:id", async (req, res) => {
  let post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ msg: "Post not found" });
  } else {
    return res.status(200).json(post);
  }
});

/**
 * @DESC To GET all posts
 * @ACCESS Public
 * @TYPE GET
 * @ROUTE /api/posts
 */
router.get("/", async (req, res) => {
  let { page } = req.query;
  const options = {
    limit: 10,
    page: page || 1,
    sort: { createdAt: -1 },
    customLabels,
    populate: [
      {
        path: "user",
        select: "firstName lastName username"
      }
    ]
  };
  let results = await Post.paginate({}, options);
  return res.json(results);
});

const deleteImage = async filePath => {
  try {
    imagePath = path.join(__dirname, `../public${filePath}`);
    await fs.unlinkSync(imagePath);
  } catch (err) {
    return;
  }
};

const postUtility = async (req, res, actionType) => {
  try {
    let { id } = req.params;
    let post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ msg: "Post not found.", success: false });
    }
    if (req.user._id.toString() !== post.user.toString()) {
      return res.status(401).json({ msg: "Unauthorized", success: false });
    }

    let result;

    if (actionType === "edit") {
      post.title = req.body.title;
      post.body = req.body.body;

      if (req.file) {
        if (post.imageURL) {
          await deleteImage(post.imageURL);
        }
        post.imageURL = req.file.path.replace("public", "");
      }
      result = await post.save();
    } else {
      post.imageURL ? await deleteImage(post.imageURL) : null;
      result = await post.delete();
    }

    return res.status(201).json({
      msg:
        actionType === "edit"
          ? `Post edited successfully.`
          : `Post deleted successfully.`,
      success: true,
      post: result
    });
  } catch (err) {
    return res.status(403).json({
      msg: `Unable to ${actionType} the post. Please try again.`,
      success: false
    });
  }
};

module.exports = router;
