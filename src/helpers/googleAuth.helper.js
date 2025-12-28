import axios from "axios";

// This comes from your Firebase/Google Console configuration
const EXPECTED_AUDIENCE = "400619671340-ndjjdcr3fs8bsalutjb9ldqs1egma49v.apps.googleusercontent.com";

const verifyGoogleToken = async (idToken) => {
  try {
    // Verify valid token via Google's public endpoint
    console.log("Verifying ID Token with Google...");
    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );

    const payload = response.data;
    console.log("Token Payload Audience:", payload.aud);

    // Verify Audience
    if (payload.aud !== EXPECTED_AUDIENCE) {
      console.error(`Audience Mismatch! Expected ${EXPECTED_AUDIENCE} but got ${payload.aud}`);
      throw new Error("Token audience mismatch (Invalid Client ID)");
    }

    return payload; // Returns { email, name, picture, sub, etc. }
  } catch (error) {
    console.error("Token verification failed details:", error.response?.data || error.message);
    throw new Error("Invalid Google/Firebase Token");
  }
};

export default verifyGoogleToken;
