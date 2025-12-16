import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const verifyGoogleToken = async (idToken) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload(); // Returns { email, name, picture, sub, etc. }
  } catch (error) {
    throw new Error("Invalid Google Token");
  }
};

export default verifyGoogleToken;
