const express = require("express");
const { protect,adminOnly} = require("../middlewares/authMiddleware");
const { getUsers, getUserById } = require("../controllers/userController");

const router = express.Router();

//User Manager Routes
router.get("/", protect, adminOnly, getUsers ); //get all users
router.get("/:id", protect, getUserById  );
// router.delete("/:id", protect, adminOnly, deleteUser ); //delete user Admin-only


module.exports = router;
