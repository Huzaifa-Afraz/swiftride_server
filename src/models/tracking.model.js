import mongoose from "mongoose";

const pointSchema = new mongoose.Schema({
  lat: Number,
  lng: Number,
  speed: Number,
  timestamp: { type: Date, default: Date.now }
});

const trackingSchema = new mongoose.Schema({
  booking: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Booking", 
    required: true, 
    unique: true // One tracking document per booking
  },
  routePoints: [pointSchema] // All the dots on the map
});

export const Tracking = mongoose.model("Tracking", trackingSchema);