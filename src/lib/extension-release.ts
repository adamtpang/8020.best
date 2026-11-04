// One place for the downloadable extension build. Update all three together
// when publishing a new zip to public/downloads (scripts/package-extension.ps1
// in the parent repo prints the hash).
export const EXTENSION_VERSION = "0.5.1";
export const EXTENSION_ZIP = `/downloads/8020-extension-v${EXTENSION_VERSION}.zip`;
export const EXTENSION_SHA256 =
  "2620086b2e258eb2e2c46edc072e15ffd9c515050e5d5b5e6e4407336750f034";

// Where every "Get 8020" button points. The Chrome Web Store listing is not
// live yet; switch this to the store URL once it is.
export const INSTALL_URL = "/download";
