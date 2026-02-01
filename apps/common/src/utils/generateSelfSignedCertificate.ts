import forge from 'node-forge';

export function generateSelfSignedCertificate() {
  const { privateKey, publicKey } = forge.pki.rsa.generateKeyPair(2048);
  const dn = {
    commonName: 'LocalSend User',
    organizationName: '',
    organizationalUnitName: '',
    localityName: '',
    stateOrProvinceName: '',
    countryName: ''
  };

  const csr = forge.pki.createCertificationRequest();

  csr.publicKey = publicKey;
  csr.setSubject(Object.entries(dn).map(([name, value]) => ({ name, value })));
  csr.sign(privateKey);

  // Generate a self-signed certificate
  const certificate = forge.pki.createCertificate();

  certificate.setSubject(csr.subject.attributes);
  certificate.setIssuer(csr.subject.attributes);
  certificate.publicKey = publicKey;
  certificate.serialNumber = '01';
  certificate.validity.notBefore = new Date();
  certificate.validity.notAfter = new Date();
  certificate.validity.notAfter.setFullYear(
    certificate.validity.notBefore.getFullYear() + 10
  );
  certificate.sign(privateKey);

  // Convert the certificate to PEM format
  const certificatePem = forge.pki.certificateToPem(certificate);

  // Calculate the hash of the certificate
  const md = forge.md.sha256.create();
  md.update(certificatePem);
  const hash = md.digest().toHex().toUpperCase();

  // Encode keys to PEM format
  const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
  const publicKeyPem = forge.pki.publicKeyToPem(publicKey);

  // Return the security context
  return {
    privateKey: privateKeyPem,
    publicKey: publicKeyPem,
    certificate: certificatePem,
    hash
  };
}
