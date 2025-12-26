import { Booking } from "../models/booking.model.js";
import { Tracking } from "../models/tracking.model.js";

export const processLocationUpdate = async (bookingId, coords) => {
  const { lat, lng, heading, speed } = coords;

  // 1. Update Booking (Quick Access for "Where is it NOW?")
  await Booking.findByIdAndUpdate(bookingId, {
    $set: {
      "currentLocation.lat": lat,
      "currentLocation.lng": lng,
      "currentLocation.heading": heading,
      "currentLocation.updatedAt": new Date()
    }
  });

  // 2. Push to History (For "Where did it go?" path)
  await Tracking.updateOne(
    { booking: bookingId },
    { 
      $push: { 
        routePoints: { lat, lng, speed, heading, timestamp: new Date() } 
      } 
    },
    { upsert: true } // Create the tracking doc if it doesn't exist yet
  );

  return { bookingId, lat, lng, heading };
};