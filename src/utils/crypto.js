const { CryptoJS } = require("../utils/imports.util");
const { JWT_SECRET } = require("../config/serverConfig");

function encrypt(text) {
  return CryptoJS.AES.encrypt(text, JWT_SECRET).toString();
}

function decrypt(ciphertext) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, JWT_SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
}

module.exports = { encrypt, decrypt };
