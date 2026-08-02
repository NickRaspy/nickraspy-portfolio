import { createSocialImage, socialImageSize } from "@/src/seo/socialImage";

export const alt = "Nickraspy full-stack developer portfolio";
export const size = socialImageSize;
export const contentType = "image/png";

export default function OpenGraphImage() {
  return createSocialImage();
}
