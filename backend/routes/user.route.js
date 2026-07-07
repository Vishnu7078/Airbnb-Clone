import express from "express"
import isAuth from "../middleware/isAuth.js"
import { getCurrentUser ,addToWishlist} from "../controllers/user.controller.js"


let userRouter = express.Router()

userRouter.get("/currentuser",isAuth,getCurrentUser)

userRouter.put("/Wishlist/:id",isAuth,addToWishlist)

export default userRouter

