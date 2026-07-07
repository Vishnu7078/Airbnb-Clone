import Booking from "../model/booking.model.js"
import Listing from "../model/listing.model.js"
import User from "../model/user.model.js"
import sendMail from "../utils/sendMail.js"
import generateOTP from "../utils/otp.js"

console.log("CreateBooking controller callled");
export const createBooking = async (req,res) => {
   try {
    let {id} = req.params
    let {checkIn ,checkOut ,totalRent} = req.body
    
    let listing = await Listing.findById(id)
    if(!listing){
        return res.status(404).json({message:"Listing is not found"})
    }

    if (listing.host.toString() === req.userId.toString()) {
    return res.status(400).json({
        message: "You cannot book your own listing"
    });
}

    if (new Date(checkIn) >= new Date(checkOut)){
        return res.status(400).json({message:"Invaild checkIn/checkOut date"})

    }
    if(listing.isBooked){
        return res.status(400).json({message:"Listing is already Booked"})
    }
    const user = await User.findById(req.userId);

if (!user) {
    return res.status(404).json({ message: "User not found" });
}

const otp = generateOTP();

user.bookingOtp = otp;
user.bookingOtpExpiry = Date.now() + 5 * 60 * 1000;

user.pendingBooking = {
    checkIn,
    checkOut,
    totalRent,
    listingId: listing._id
};

await user.save();

await sendMail(
    user.email,
    "Booking OTP",
    `Your booking OTP is ${otp}. Valid for 5 minutes.`
);

return res.status(200).json({
    message: "OTP sent to your email"
});
    // let booking = await Booking.create({
    //     checkIn,
    //     checkOut,
    //     totalRent,
    //     host:listing.host,
    //     guest:req.userId,
    //     listing:listing._id
    // })
    // await booking.populate("host", "email" );
    // let user = await User.findByIdAndUpdate(req.userId,{
    //     $push:{booking:listing}
    // },{new:true})
    // if(!user){
    //     return res.status(404).json({message:"User is not found"})
    // }
    // listing.guest=req.userId
    // listing.isBooked=true
    // await listing.save()
    // return res.status(201).json(booking)

   } catch (error) {
    
    return res.status(500).json({message:`booking error ${error}`})
   }
    
}
export const cancelBooking = async (req,res) => {
    try {
        let {id} = req.params
        let listing = await Listing.findByIdAndUpdate(id,{isBooked:false})
        let user = await User.findByIdAndUpdate(listing.guest,{
            $pull:{booking:listing._id}
        },{new:true})
        if(!user){
            return res.status(404).json({message:"user is not found"})
        }
        return res.status(200).json({message:"booking cancelled"})

    } catch (error) {
        return res.status(500).json({message:"booking cancel error"})
    }
    
}

export const testMail = async (req, res) => {     
  try {
    await sendMail(
      process.env.EMAIL_USER,
      "Test Email",
      "Congratulations! Nodemailer is working."
    );

    return res.status(200).json({
      message: "Email sent successfully"
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};



export const verifyBookingOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      user.bookingOtp !== otp ||
      user.bookingOtpExpiry < Date.now()
    ) {
      return res.status(400).json({
        message: "Invalid or Expired OTP"
      });
    }

    const data = user.pendingBooking;

    const listing = await Listing.findById(data.listingId);

    const booking = await Booking.create({
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      totalRent: data.totalRent,
      host: listing.host,
      guest: req.userId,
      listing: listing._id
    });

    await booking.populate("host", "email");

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
      booking
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};