import express from "express"
import isAuth from "../middleware/isAuth.js"
import {
  cancelBooking,
  createBooking,
  verifyBookingOtp,
  testMail
} from "../controllers/booking.controller.js"

let bookingRouter = express.Router()

bookingRouter.post("/create/:id",isAuth,createBooking)
bookingRouter.post("/verify-otp",isAuth,verifyBookingOtp)
bookingRouter.delete("/cancel/:id",isAuth,cancelBooking)
bookingRouter.get("/test-mail",testMail)

export default bookingRouter
