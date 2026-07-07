import Booking from "../model/booking.model.js";
import Listing from "../model/listing.model.js";
import User from "../model/user.model.js";
import sendMail from "../utils/sendMail.js";
import generateOTP from "../utils/otp.js";




export const createBooking = async (req, res) => {
  try {
    console.log("CreateBooking API HIT");

    const { id } = req.params;
    const { checkIn, checkOut, totalRent } = req.body;

    const listing = await Listing.findById(id);

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

    user.bookingOtpExpiry =
      Date.now() + 5 * 60 * 1000;

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

    console.log("CREATE BOOKING ERROR:", error);
    console.log(error.stack);

    return res.status(500).json({
      message: error.message,
    });
  }
};




export const verifyBookingOtp = async (req, res) => {
  try {

    const { otp } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.pendingBooking) {
      return res.status(400).json({
        message: "No pending booking found",
      });
    }

    if (
      String(user.bookingOtp) !== String(otp) ||
      !user.bookingOtpExpiry ||
      user.bookingOtpExpiry < Date.now()
    ) {
      return res.status(400).json({
        message: "Invalid or Expired OTP",
      });
    }

    const data = user.pendingBooking;

    const listing = await Listing.findById(
      data.listingId
    );

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

  

    if (listing.isBooked) {
      return res.status(400).json({
        message: "Listing is already Booked",
      });
    }

    const booking = await Booking.create({

      checkIn: data.checkIn,

      checkOut: data.checkOut,

      totalRent: data.totalRent,

      host: listing.host,

      guest: req.userId,

      listing: listing._id,
    });

    user.booking.push(booking._id);

    user.bookingOtp = null;

    user.bookingOtpExpiry = null;

    user.pendingBooking = null;

    await user.save();


    listing.guest = req.userId;

    listing.isBooked = true;

    await listing.save();


    return res.status(201).json({

      message: "Booking Successful",

      booking,
    });

  } catch (error) {

    console.log("VERIFY OTP ERROR:", error);

    console.log(error.stack);

    return res.status(500).json({

      message: error.message,
    });
  }
};




export const cancelBooking = async (req, res) => {

  try {

    const { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    const guestId = listing.guest;

    if (!guestId) {
      return res.status(400).json({
        message: "No booking found for this listing",
      });
    }

    await User.findByIdAndUpdate(
      guestId,
      {
        $pull: {
          booking: listing._id,
        },
      }
    );

    listing.isBooked = false;

    listing.guest = null;

    await listing.save();


    return res.status(200).json({

      message: "Booking cancelled",
    });

  } catch (error) {

    console.log("CANCEL BOOKING ERROR:", error);

    console.log(error.stack);

    return res.status(500).json({

      message: error.message,
    });
  }
};




export const testMail = async (req, res) => {

  try {

    await sendMail(

      process.env.EMAIL_USER,

      "Test Email",

      "Congratulations! Nodemailer is working."
    );


    return res.status(200).json({

      message: "Email sent successfully",
    });

  } catch (error) {

    console.log("TEST MAIL ERROR:", error);

    console.log(error.stack);

    return res.status(500).json({

      message: error.message,
    });
  }
};