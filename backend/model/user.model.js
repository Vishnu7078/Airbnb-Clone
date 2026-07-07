import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },

    otp: {
  type: String,
  },

 otpExpire: {
  type: Date,
 },

   isVerified: {
    type: Boolean,
    default: false,
   },

    listing:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Listing"
    }],
    booking:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Listing"
    }],

    wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing"
}],

bookingOtp: {
    type: String,
    default: null
},

bookingOtpExpiry: {
    type: Date,
    default: null
},

pendingBooking: {
    type: Object,
    default: null
},
    


},{timestamps:true})

const User = mongoose.model("User",userSchema)

export default User

