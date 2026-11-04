// One place for the downloadable builds. When publishing a new release:
// run scripts/package-extension.ps1 and scripts/package-companion.ps1 in the
// parent repo, copy the "-download" extension zip and the companion zip into
// public/downloads, then update the version and both hashes here (a test
// checks them against the files).
export const EXTENSION_VERSION = "0.5.3";
export const EXTENSION_ZIP = `/downloads/8020-extension-v${EXTENSION_VERSION}.zip`;
export const EXTENSION_SHA256 =
  "4a149e108c1c1b02754d2a883835779c2ab663979f1b18939d732f6403823eb6";
// The download build carries a fixed public key, so every install gets this
// ID and the companion installer trusts it without extra setup.
export const EXTENSION_ID = "pmbemhkbddpopmlkmffpnfajaoggeafl";

export const COMPANION_ZIP = `/downloads/8020-companion-v${EXTENSION_VERSION}.zip`;
export const COMPANION_SHA256 =
  "a8ccc8c4bf782f8b55bed4e6485baf8c1b43ad59dcf96c460cdddc17399301ac";

// Where every "Get 8020" button points. The Chrome Web Store listing is not
// live yet; switch this to the store URL once it is.
export const INSTALL_URL = "/download";
