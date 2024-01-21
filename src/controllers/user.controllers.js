import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  console.log(email);

  //user details from frontend
  //validation - chech whether for empty
  //check if user is alredy exist - username, email
  //check for avtar and image
  // check cloudinary, avatar
  //create user object, create entry in db
  //remove password and refresh token field from respponse
  //check for user creation
  //return res
});

export { registerUser };
