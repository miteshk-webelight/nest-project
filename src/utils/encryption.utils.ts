import crypto from "crypto";

import { secretConfig } from "src/config/secret.config";

export const decryptValue = (value: string): string => {
  const decryptedData = crypto.privateDecrypt(
    {
      key: secretConfig.privateKey,
      passphrase: secretConfig.privateKeyPassphrase,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(value, "base64"),
  );

  return decryptedData.toString("utf-8");
};

export const encryptValue = (value: string): string => {
  const encryptedData = crypto.publicEncrypt(
    {
      key: secretConfig.publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(value, "utf-8"),
  );

  return encryptedData.toString("base64");
};
