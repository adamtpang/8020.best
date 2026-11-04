// One place for the downloadable extension build. Update all three together
// when publishing a new zip to public/downloads (scripts/package-extension.ps1
// in the parent repo prints the hash).
export const EXTENSION_VERSION = "0.5.2";
export const EXTENSION_ZIP = `/downloads/8020-extension-v${EXTENSION_VERSION}.zip`;
export const EXTENSION_SHA256 =
  "3c580dcd04c60e6c4125eadb32409b4521072a6786b6d9ff205463c49594c89d";

// Where every "Get 8020" button points. The Chrome Web Store listing is not
// live yet; switch this to the store URL once it is.
export const INSTALL_URL = "/download";
