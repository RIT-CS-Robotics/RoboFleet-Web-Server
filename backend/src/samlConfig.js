const fs = require('fs');
const path = require('path');
const { Strategy: SamlStrategy } = require('@node-saml/passport-saml');

/** SP Section **/
// Base URL of your site (Updated for your RIT project domain)
const BASE_URL = 'https://robotics-project.gccis.rit.edu/';

// Your generated entity id
const SP_ENTITY_ID = 'https://robotics-project.gccis.rit.edu/saml2';

// Your generated keypair information
const SP_PVK = fs.readFileSync(path.join(__dirname, '../certificates', 'service.key'), { encoding: 'utf8' });
const SP_CERT = fs.readFileSync(path.join(__dirname, '../certificates', 'service.crt'), { encoding: 'utf8' });
/** End SP Section **/

/** IdP Section **/
// Single-sign-on url for your IdP, defaults to Redirect binding
const IDP_SSO_URL = 'https://shibboleth.main.ad.rit.edu/idp/profile/SAML2/Redirect/SSO';

// Base64 encoded certificate (PEM) for RIT's IdP
const IDP_CERT = fs.readFileSync(path.join(__dirname, '../certificates', 'idp.crt'), { encoding: 'utf8' });
/** End IdP Section **/

/** Common Settings **/
const defaultSamlStrategy = new SamlStrategy(
  {
    name: 'saml',
    callbackUrl: BASE_URL + 'saml2/acs', // This maps to https://rit.edu
    entryPoint: IDP_SSO_URL,
    issuer: SP_ENTITY_ID,
    idpCert: IDP_CERT,
    decryptionPvk: SP_PVK,
    decryptionCert: SP_CERT,
    privateKey: SP_PVK,       // Needed by newer @node-saml variants for signing requests
    signingCert: SP_CERT,     // Needed by newer @node-saml variants for signing requests
    signMetadata: true,
    wantAssertionsSigned: true,
    wantAuthnResponseSigned: true,
    disableRequestedAuthnContext: true
  },
  /* acs callback */
  (profile, done) => {
    // Called after successful authentication, parse
    // the attributes in profile.attributes and create
    // or update a local user. Then return that user.
    return done(null, profile.attributes);
  }
  /* end acs callback */
);

module.exports = { defaultSamlStrategy, IDP_CERT, SP_PVK, SP_CERT };
