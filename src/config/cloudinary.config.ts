import { v2 as cloudinary } from "cloudinary";

import { getOsEnv } from "./env.config";

cloudinary.config({
  cloud_name: getOsEnv("CLOUDINARY_CLOUD_NAME"),
  api_key: getOsEnv("CLOUDINARY_API_KEY"),
  api_secret: getOsEnv("CLOUDINARY_API_SECRET"),
});

export default cloudinary;
