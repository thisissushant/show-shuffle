import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const genrateAccessAndRefereshTokens = async(userId){
    try {
        const user = await User.findById()

        const accessToken = user.generateAccessToken ()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        
        return({accessToken, refreshToken})
        
        
    } catch (error) {
        throw new ApiError(500, "Somthing went wrong while genrati tokens")
        
    }
}

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullname } = req.body;

  if (
    [fullname, email, username, password].some((field) => !field?.trim() === "")
  ) {
    throw new ApiError(400, "all fields are reqired");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "user alredy register");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar is reqired");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "avatar is reqired");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "user registration failed");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registerd Successfully"));

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
const loginUser = asyncHandler(async(req, res) => {
    //req-body -> data
    //username or email
    //find the user 
    //password chack
    //genrate access token and refresh token 
    //send cookes
    const {username, email, password} = req.body
    if(!username || !email){
        throw new ApiError(400, "email or username is required")
    }
    const user = User.findOne({
        $or: [{username}, {email}]
        })
        if (!user) {
            throw new ApiError(404, "user not found!")  
        }
        const isPasswordVaild = await user.isPasswordCorrect(password)

        if (!isPasswordVaild) {
            throw new ApiError(401, "user not exist") 
        }

        const {accessToken, refreshToken} = await genrateAccessAndRefereshTokens(user._id)

        const loggedInUser = await User.findById(user._id).select("-password, refreshToken")

        const options={
            httpOnly:true,
            secure:true
        }
        return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(
            new ApiResponse(200,{
                user: loggedInUser, accessToken, refreshToken
            },
            "User logedin  successfully"
            )
        )
})

const logoutUser = asyncHandler(async(req, res) =>{
    await User.findByIdAndUpdate(
        req.user._id,{
            $set:{
                refreshToken: undefined
            }
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, " User logout Successfully"))
})

export { registerUser, loginUser, logoutUser };
