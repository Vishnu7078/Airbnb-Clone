import Booking from "../model/booking.model.js"
import Listing from "../model/listing.model.js"
import User from "../model/user.model.js"
import sendMail from "../utils/sendMail.js"
import generateOTP from "../utils/otp.js"


export const createBooking = async (req, res) => {
  try {
    console.log("CreateBooking API HIT");
    let { id } = req.params;
    let { checkIn, checkOut, totalRent } = req.body;

    let listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        message: "Listing is not found",
      });
    }

    if (listing.host.toString() === req.userId.toString()) {
      return res.status(400).json({
        message: "You cannot book your own listing",
      });
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      return res.status(400).json({
        message: "Invalid checkIn/checkOut date",
      });
    }

    if (listing.isBooked) {
      return res.status(400).json({
        message: "Listing is already Booked",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const otp = generateOTP();
    console.log("OTP Generated:", otp);

    user.bookingOtp = otp;
    user.bookingOtpExpiry = Date.now() + 5 * 60 * 1000;

    user.pendingBooking = {
      checkIn,
      checkOut,
      totalRent,
      listingId: listing._id,
    };

    await user.save();
    console.log("User Saved");

    console.log("Before sendMail");

    await sendMail(
      user.email,
      "Booking OTP",
      `Your booking OTP is ${otp}. Valid for 5 minutes.`
    );

    console.log("After sendMail");

    return res.status(200).json({
      message: "OTP sent to your email",
    });

  } catch (error) {
    console.log("BOOKING ERROR:", error);
    console.log(error.stack);

    return res.status(500).json({
      message: error.message,
    });
  }
};